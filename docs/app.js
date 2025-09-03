import {
  encodeFunctionData,
  decodeFunctionResult,
} from "https://esm.sh/viem@2.21.1";

(() => {
  "use strict";

  /** DOM elements */
  const elements = {
    connectButton: null,
    connectionStatus: null,
    statusText: null,
    noProvider: null,
    accountDisplay: null,
    chainDisplay: null,
    balanceDisplay: null,
    minterFieldset: null,
    minterStatus: null,
    loadProjectButton: null,
    projectSelect: null,
    networkWarning: null,
    minterInfo: null,
    minterAddress: null,
    minterType: null,
    minterError: null,
    minterErrorText: null,
  };

  /** wallet state */
  const state = {
    ethereum: null,
    account: null,
    chainId: null,
    projectsByChain: null,
    projectNameCache: Object.create(null),
    coreAbi: null,
    minterFilterAbi: null,
    supportedMinterFilters: null,
    supportedMinterTypes: null,
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    // cache elements
    elements.connectButton = document.getElementById("connectButton");
    elements.connectionStatus = document.getElementById("connectionStatus");
    elements.statusText = document.getElementById("statusText");
    elements.noProvider = document.getElementById("noProvider");
    elements.accountDisplay = document.getElementById("accountDisplay");
    elements.chainDisplay = document.getElementById("chainDisplay");
    elements.balanceDisplay = document.getElementById("balanceDisplay");
    elements.minterFieldset = document.getElementById("minterFieldset");
    elements.minterStatus = document.getElementById("minterStatus");
    elements.loadProjectButton = document.getElementById("loadProject");
    elements.projectSelect = document.getElementById("projectSelect");
    elements.networkWarning = document.getElementById("networkWarning");
    elements.minterInfo = document.getElementById("minterInfo");
    elements.minterAddress = document.getElementById("minterAddress");
    elements.minterType = document.getElementById("minterType");
    elements.minterError = document.getElementById("minterError");
    elements.minterErrorText = document.getElementById("minterErrorText");
    if (elements.projectSelect) {
      elements.projectSelect.addEventListener("change", () => {
        if (elements.loadProjectButton) {
          elements.loadProjectButton.disabled = !elements.projectSelect.value;
        }
      });
    }

    // wire events
    elements.connectButton?.addEventListener("click", connectWallet);
    elements.loadProjectButton?.addEventListener("click", loadProjectDetails);

    // detect provider
    if (typeof window !== "undefined" && window.ethereum) {
      state.ethereum = window.ethereum;
      registerEip1193Listeners();
      // Initialize with current accounts/chain without requesting permissions
      Promise.allSettled([
        state.ethereum.request({ method: "eth_chainId" }),
        state.ethereum.request({ method: "eth_accounts" }),
      ]).then((results) => {
        const [chainResult, accountsResult] = results;
        if (chainResult.status === "fulfilled") {
          state.chainId = normalizeChainId(chainResult.value);
        }
        if (accountsResult.status === "fulfilled") {
          const accounts = accountsResult.value;
          state.account =
            Array.isArray(accounts) && accounts.length ? accounts[0] : null;
        }
        updateUi();
        // Load ABIs first, then projects data
        Promise.all([
          loadCoreAbi(),
          loadMinterFilterAbi(),
          loadSupportedMinterFilters(),
          loadSupportedMinterTypes(),
        ])
          .then(() => {
            // Only load projects after ABIs are ready
            loadProjectsJson().catch(() => {});
          })
          .catch(() => {});
        refreshBalance().catch(() => {});
      });
    } else {
      // No provider detected
      elements.noProvider.hidden = false;
      setConnectionStatus(false, "No wallet detected");
      setMinterEnabled(false);
    }
  }

  function registerEip1193Listeners() {
    if (!state.ethereum || !state.ethereum.on) return;
    state.ethereum.on("accountsChanged", handleAccountsChanged);
    state.ethereum.on("chainChanged", handleChainChanged);
    state.ethereum.on("disconnect", (error) => {
      console.warn("Provider disconnected", error);
      state.account = null;
      setMinterEnabled(false);
      updateUi();
    });
    state.ethereum.on("connect", (info) => {
      // info: { chainId }
      if (info && info.chainId) {
        state.chainId = normalizeChainId(info.chainId);
      }
      updateUi();
    });
  }

  async function connectWallet() {
    if (!state.ethereum) return;
    try {
      const accounts = await state.ethereum.request({
        method: "eth_requestAccounts",
      });
      state.account = accounts && accounts.length ? accounts[0] : null;
      state.chainId = normalizeChainId(
        await state.ethereum.request({ method: "eth_chainId" })
      );
      updateUi();
      await refreshBalance();
    } catch (err) {
      console.error("Failed to connect:", err);
      setStatusText(
        err && err.message ? `Error: ${err.message}` : "Connection rejected"
      );
    }
  }

  function handleAccountsChanged(accounts) {
    state.account =
      Array.isArray(accounts) && accounts.length ? accounts[0] : null;
    updateUi();
    refreshBalance().catch(() => {});
  }

  function handleChainChanged(chainId) {
    state.chainId = normalizeChainId(chainId);
    updateUi();
    populateProjectsDropdown();
    refreshBalance().catch(() => {});
  }

  function updateUi() {
    const isConnected = Boolean(state.account);
    const isSupported = isChainSupported(state.chainId);

    setConnectionStatus(
      isConnected,
      isConnected ? "Connected" : "Not connected"
    );
    setMinterEnabled(isConnected && isSupported);
    toggleNetworkWarning(isConnected && !isSupported);

    // Toggle connect button label
    if (elements.connectButton) {
      elements.connectButton.textContent = isConnected
        ? "Connected"
        : "Connect Wallet";
      elements.connectButton.disabled = isConnected ? true : false;
    }

    // Account display
    elements.accountDisplay.textContent = isConnected
      ? shortenAddress(state.account)
      : "—";

    // Chain display
    const chainName = chainNameFromId(state.chainId);
    elements.chainDisplay.textContent = state.chainId
      ? `${chainName} (${state.chainId})`
      : "—";

    // Populate dropdown when prerequisites are ready
    populateProjectsDropdown();
  }

  function setMinterEnabled(enabled) {
    if (elements.minterFieldset) {
      elements.minterFieldset.disabled = !enabled;
    }
    if (elements.minterStatus) {
      elements.minterStatus.textContent = enabled ? "Ready" : "Disconnected";
    }
  }

  function toggleNetworkWarning(show) {
    if (!elements.networkWarning) return;
    elements.networkWarning.hidden = !show;
  }

  function setConnectionStatus(connected, text) {
    if (elements.connectionStatus) {
      elements.connectionStatus.dataset.status = connected
        ? "connected"
        : "disconnected";
    }
    setStatusText(text);
  }

  function setStatusText(text) {
    if (elements.statusText) {
      elements.statusText.textContent = text;
    }
  }

  async function refreshBalance() {
    if (!state.ethereum || !state.account) {
      elements.balanceDisplay.textContent = "—";
      return;
    }
    try {
      const balanceHex = await state.ethereum.request({
        method: "eth_getBalance",
        params: [state.account, "latest"],
      });
      const balanceEth = formatEth(balanceHex);
      elements.balanceDisplay.textContent = `${balanceEth} ETH`;
    } catch (err) {
      console.warn("Failed to fetch balance", err);
      elements.balanceDisplay.textContent = "—";
    }
  }

  function normalizeChainId(chainId) {
    if (!chainId) return null;
    // chainId can be hex string or decimal number
    if (typeof chainId === "string") {
      return chainId.startsWith("0x")
        ? parseInt(chainId, 16)
        : parseInt(chainId, 10);
    }
    if (typeof chainId === "number") return chainId;
    return null;
  }

  function chainNameFromId(chainId) {
    if (!chainId && chainId !== 0) return "Unknown";
    const mapping = {
      1: "Ethereum Mainnet",
      11155111: "Sepolia",
    };
    return mapping[chainId] || `Chain ${chainId}`;
  }

  function shortenAddress(address) {
    if (!address || address.length < 10) return address || "";
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  }

  function formatEth(balanceHex) {
    try {
      const wei = BigInt(balanceHex);
      const ether = Number(wei) / 1e18;
      // Avoid scientific notation for small values; fixed to 4 decimals
      return ether.toFixed(4);
    } catch (_) {
      return "0.0000";
    }
  }

  function isChainSupported(chainId) {
    return chainId === 1 || chainId === 11155111;
  }

  async function loadProjectsJson() {
    try {
      const res = await fetch("./projects.json", { cache: "no-store" });
      if (!res.ok)
        throw new Error(`Failed to load projects.json: ${res.status}`);
      const data = await res.json();
      state.projectsByChain = data;
      populateProjectsDropdown();
    } catch (err) {
      console.warn("projects.json load error", err);
      state.projectsByChain = null;
    }
  }

  async function loadCoreAbi() {
    try {
      console.log("Loading core ABI...");
      const res = await fetch("./abi/GenArt721CoreV3_Engine.json", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed to load ABI: ${res.status}`);
      const data = await res.json();
      state.coreAbi = data.abi;
      console.log(
        "Core ABI loaded successfully, functions:",
        state.coreAbi
          .filter((item) => item.type === "function")
          .map((f) => f.name)
      );
      // Refresh dropdown to load project names now that ABI is available
      populateProjectsDropdown();
    } catch (err) {
      console.error("ABI load error", err);
      state.coreAbi = null;
    }
  }

  async function loadMinterFilterAbi() {
    try {
      const res = await fetch("./abi/MinterFilterV2.json", {
        cache: "no-store",
      });
      if (!res.ok)
        throw new Error(`Failed to load MinterFilter ABI: ${res.status}`);
      const data = await res.json();
      state.minterFilterAbi = data.abi;
    } catch (err) {
      console.warn("MinterFilter ABI load error", err);
      state.minterFilterAbi = null;
    }
  }

  async function loadSupportedMinterFilters() {
    try {
      const res = await fetch("./supported-minter-filters.json", {
        cache: "no-store",
      });
      if (!res.ok)
        throw new Error(
          `Failed to load supported minter filters: ${res.status}`
        );
      const data = await res.json();
      state.supportedMinterFilters = data;
    } catch (err) {
      console.warn("Supported minter filters load error", err);
      state.supportedMinterFilters = null;
    }
  }

  async function loadSupportedMinterTypes() {
    try {
      const res = await fetch("./supported-minter-types.json", {
        cache: "no-store",
      });
      if (!res.ok)
        throw new Error(`Failed to load supported minter types: ${res.status}`);
      const data = await res.json();
      state.supportedMinterTypes = data;
    } catch (err) {
      console.warn("Supported minter types load error", err);
      state.supportedMinterTypes = null;
    }
  }

  function populateProjectsDropdown() {
    if (!elements.projectSelect) return;
    // reset options except the first placeholder
    const select = elements.projectSelect;
    for (let i = select.options.length - 1; i >= 1; i -= 1) {
      select.remove(i);
    }

    const chainId = state.chainId;
    const isSupported = isChainSupported(chainId);
    const chainKey = chainId != null ? String(chainId) : null;
    const projects =
      isSupported &&
      state.projectsByChain &&
      chainKey &&
      state.projectsByChain[chainKey]
        ? state.projectsByChain[chainKey].projects
        : [];

    if (projects.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No projects available for this network";
      opt.disabled = true;
      select.appendChild(opt);
      elements.loadProjectButton &&
        (elements.loadProjectButton.disabled = true);
      return;
    }

    // If ABI isn't loaded yet, show projects without names for now
    if (!state.coreAbi) {
      projects.forEach((pid) => {
        const opt = document.createElement("option");
        opt.value = pid;
        opt.textContent = `${compactProjectId(pid)} | (loading...)`;
        select.appendChild(opt);
      });
      return;
    }

    // ABI is loaded, fetch project names
    const labelPromises = projects.map((pid) => buildProjectOptionLabel(pid));
    Promise.allSettled(labelPromises).then((results) => {
      // Clear loading options and add real ones
      for (let i = select.options.length - 1; i >= 1; i -= 1) {
        select.remove(i);
      }

      results.forEach((res, idx) => {
        const pid = projects[idx];
        const opt = document.createElement("option");
        opt.value = pid;
        opt.textContent =
          res.status === "fulfilled"
            ? res.value
            : `${compactProjectId(pid)} | (unknown)`;
        select.appendChild(opt);
      });
    });
  }

  async function buildProjectOptionLabel(projectIdStr) {
    const compactId = compactProjectId(projectIdStr);
    const cacheKey = `${state.chainId}:${projectIdStr}`;
    if (state.projectNameCache[cacheKey]) {
      return `${compactId} | ${state.projectNameCache[cacheKey]}`;
    }
    const parsed = parseProjectId(projectIdStr);
    if (!parsed) return `${compactId} | (invalid)`;
    const name = await fetchProjectName(
      parsed.contractAddress,
      parsed.projectNumber
    );
    if (name) state.projectNameCache[cacheKey] = name;
    return `${compactId} | ${name || "(unknown)"}`;
  }

  function compactProjectId(projectIdStr) {
    const parsed = parseProjectId(projectIdStr);
    if (!parsed) return projectIdStr;
    const a = parsed.contractAddress;
    const n = String(parsed.projectNumber);
    return `${a.slice(0, 6)}…${a.slice(-4)}-${n}`;
  }

  function parseProjectId(projectIdStr) {
    if (!projectIdStr) return null;
    const i = projectIdStr.lastIndexOf("-");
    if (i <= 1) return null;
    const contractAddress = projectIdStr.slice(0, i);
    const projectNumberStr = projectIdStr.slice(i + 1);
    if (!/^0x[0-9a-fA-F]{40}$/.test(contractAddress)) return null;
    const projectNumber = Number(projectNumberStr);
    if (!Number.isFinite(projectNumber) || projectNumber < 0) return null;
    return { contractAddress, projectNumber };
  }

  async function fetchProjectName(contractAddress, projectNumber) {
    if (!state.ethereum || !state.coreAbi) {
      console.warn("fetchProjectName: Missing ethereum or coreAbi", {
        hasEthereum: !!state.ethereum,
        hasCoreAbi: !!state.coreAbi,
      });
      return null;
    }
    try {
      console.log("fetchProjectName:", { contractAddress, projectNumber });

      const projectDetailsAbi = state.coreAbi.find(
        (item) => item.type === "function" && item.name === "projectDetails"
      );
      if (!projectDetailsAbi) {
        console.warn("projectDetails function not found in ABI");
        return null;
      }

      console.log("Found projectDetails ABI:", projectDetailsAbi);

      const data = encodeFunctionData({
        abi: [projectDetailsAbi],
        functionName: "projectDetails",
        args: [BigInt(projectNumber)],
      });

      console.log("Encoded call data:", data);

      const result = await state.ethereum.request({
        method: "eth_call",
        params: [{ to: contractAddress, data }, "latest"],
      });

      console.log("eth_call result:", result);

      const decoded = decodeFunctionResult({
        abi: [projectDetailsAbi],
        functionName: "projectDetails",
        data: result,
      });

      console.log("Decoded result:", decoded);
      return decoded[0]; // projectName is the first return value
    } catch (err) {
      console.error("projectDetails eth_call failed", err);
      return null;
    }
  }

  async function loadProjectDetails() {
    if (!elements.projectSelect?.value) return;

    hideMinterInfo();
    hideMinterError();

    try {
      const projectId = elements.projectSelect.value;
      console.log("Loading project details for:", projectId);

      const parsed = parseProjectId(projectId);
      if (!parsed) {
        showMinterError("Invalid project ID format");
        return;
      }

      const { contractAddress, projectNumber } = parsed;
      console.log("Parsed project:", { contractAddress, projectNumber });

      // Step 1: Check core contract's minter
      const minterFilterAddress = await getCoreMinter(contractAddress);
      if (!minterFilterAddress) {
        showMinterError("Failed to get minter from core contract");
        return;
      }

      // Step 2: Validate minter filter is supported
      if (!isMinterFilterSupported(minterFilterAddress)) {
        showMinterError(
          `Unsupported minter filter: ${shortenAddress(minterFilterAddress)}`
        );
        return;
      }

      // Step 3: Get project minter from minter filter
      const projectMinterAddress = await getProjectMinter(
        minterFilterAddress,
        projectNumber,
        contractAddress
      );
      if (!projectMinterAddress) {
        showMinterError("Failed to get project minter from minter filter");
        return;
      }

      // Step 4: Get minter type
      const minterType = await getMinterType(
        minterFilterAddress,
        projectMinterAddress
      );
      if (!minterType) {
        showMinterError("Failed to determine minter type");
        return;
      }

      // Step 5: Validate minter type is supported
      if (!isMinterTypeSupported(minterType)) {
        showMinterError(`Unsupported minter type: ${minterType}`);
        return;
      }

      // Success - show minter info
      showMinterInfo(projectMinterAddress, minterType);
    } catch (err) {
      console.error("loadProjectDetails error", err);
      showMinterError("Failed to load project details");
    }
  }

  async function getCoreMinter(contractAddress) {
    if (!state.ethereum || !state.coreAbi) {
      console.warn("getCoreMinter: Missing ethereum or coreAbi", {
        hasEthereum: !!state.ethereum,
        hasCoreAbi: !!state.coreAbi,
      });
      return null;
    }
    try {
      console.log("getCoreMinter for contract:", contractAddress);

      const minterContractAbi = state.coreAbi.find(
        (item) => item.type === "function" && item.name === "minterContract"
      );
      if (!minterContractAbi) {
        console.warn("minterContract function not found in ABI");
        return null;
      }

      console.log("Found minterContract ABI:", minterContractAbi);

      const data = encodeFunctionData({
        abi: [minterContractAbi],
        functionName: "minterContract",
        args: [],
      });

      console.log("Encoded minterContract call data:", data);

      const result = await state.ethereum.request({
        method: "eth_call",
        params: [{ to: contractAddress, data }, "latest"],
      });

      console.log("minterContract eth_call result:", result);

      const decoded = decodeFunctionResult({
        abi: [minterContractAbi],
        functionName: "minterContract",
        data: result,
      });

      console.log("Decoded minter address:", decoded);
      return decoded;
    } catch (err) {
      console.error("getCoreMinter failed", err);
      return null;
    }
  }

  function isMinterFilterSupported(minterFilterAddress) {
    if (!state.supportedMinterFilters || !state.chainId) return false;
    const chainKey = String(state.chainId);
    const supportedFilters =
      state.supportedMinterFilters[chainKey]?.minterFilters || [];

    console.log("Checking minter filter support:", {
      minterFilterAddress,
      chainKey,
      supportedFilters,
      normalizedAddress: minterFilterAddress.toLowerCase(),
      normalizedSupportedFilters: supportedFilters.map((addr) =>
        addr.toLowerCase()
      ),
    });

    // Normalize both addresses to lowercase for comparison
    const normalizedAddress = minterFilterAddress.toLowerCase();
    const normalizedSupportedFilters = supportedFilters.map((addr) =>
      addr.toLowerCase()
    );

    return normalizedSupportedFilters.includes(normalizedAddress);
  }

  async function getProjectMinter(
    minterFilterAddress,
    projectNumber,
    coreContractAddress
  ) {
    if (!state.ethereum || !state.minterFilterAbi) return null;
    try {
      console.log("getProjectMinter:", {
        minterFilterAddress,
        projectNumber,
        coreContractAddress,
      });

      const getMinterForProjectAbi = state.minterFilterAbi.find(
        (item) =>
          item.type === "function" && item.name === "getMinterForProject"
      );
      if (!getMinterForProjectAbi) {
        console.warn("getMinterForProject function not found in ABI");
        return null;
      }

      console.log("Found getMinterForProject ABI:", getMinterForProjectAbi);

      const data = encodeFunctionData({
        abi: [getMinterForProjectAbi],
        functionName: "getMinterForProject",
        args: [BigInt(projectNumber), coreContractAddress],
      });

      console.log("Encoded getMinterForProject call data:", data);

      const result = await state.ethereum.request({
        method: "eth_call",
        params: [{ to: minterFilterAddress, data }, "latest"],
      });

      console.log("getMinterForProject eth_call result:", result);

      const decoded = decodeFunctionResult({
        abi: [getMinterForProjectAbi],
        functionName: "getMinterForProject",
        data: result,
      });

      console.log("Decoded project minter address:", decoded);
      return decoded;
    } catch (err) {
      console.error("getProjectMinter failed", err);
      return null;
    }
  }

  async function getMinterType(minterFilterAddress, projectMinterAddress) {
    if (!state.ethereum || !state.minterFilterAbi) {
      console.warn("getMinterType: Missing ethereum or minterFilterAbi", {
        hasEthereum: !!state.ethereum,
        hasMinterFilterAbi: !!state.minterFilterAbi,
      });
      return null;
    }
    try {
      console.log("getMinterType:", {
        minterFilterAddress,
        projectMinterAddress,
      });

      const getAllGloballyApprovedMintersAbi = state.minterFilterAbi.find(
        (item) =>
          item.type === "function" &&
          item.name === "getAllGloballyApprovedMinters"
      );
      if (!getAllGloballyApprovedMintersAbi) {
        console.warn("getAllGloballyApprovedMinters function not found in ABI");
        return null;
      }

      console.log(
        "Found getAllGloballyApprovedMinters ABI:",
        getAllGloballyApprovedMintersAbi
      );

      const data = encodeFunctionData({
        abi: [getAllGloballyApprovedMintersAbi],
        functionName: "getAllGloballyApprovedMinters",
        args: [],
      });

      console.log("Encoded getAllGloballyApprovedMinters call data:", data);

      const result = await state.ethereum.request({
        method: "eth_call",
        params: [{ to: minterFilterAddress, data }, "latest"],
      });

      console.log("getAllGloballyApprovedMinters eth_call result:", result);

      const decoded = decodeFunctionResult({
        abi: [getAllGloballyApprovedMintersAbi],
        functionName: "getAllGloballyApprovedMinters",
        data: result,
      });

      console.log("Decoded getAllGloballyApprovedMinters result:", decoded);
      console.log("Type of decoded:", typeof decoded);
      console.log("Is decoded an array?", Array.isArray(decoded));
      console.log("Decoded length:", decoded?.length);
      console.log("Decoded[0]:", decoded[0]);
      console.log("Type of decoded[0]:", typeof decoded[0]);
      console.log("Is decoded[0] an array?", Array.isArray(decoded[0]));

      // Let's try different ways to access the data
      let mintersWithTypes;
      if (Array.isArray(decoded)) {
        if (Array.isArray(decoded[0])) {
          mintersWithTypes = decoded[0];
        } else {
          mintersWithTypes = decoded;
        }
      } else {
        mintersWithTypes = decoded;
      }

      console.log("Final mintersWithTypes:", mintersWithTypes);
      console.log("Type of mintersWithTypes:", typeof mintersWithTypes);
      console.log(
        "Is mintersWithTypes an array?",
        Array.isArray(mintersWithTypes)
      );
      console.log("Looking for project minter:", projectMinterAddress);

      if (!Array.isArray(mintersWithTypes)) {
        console.error(
          "mintersWithTypes is not an array, cannot search for minter"
        );
        return null;
      }

      // Find the minter in the array of structs
      const minterEntry = mintersWithTypes.find((entry) => {
        console.log("Checking entry:", entry);
        return (
          entry.minterAddress?.toLowerCase() ===
          projectMinterAddress.toLowerCase()
        );
      });

      console.log("Found minter entry:", minterEntry);
      const minterType = minterEntry ? minterEntry.minterType : null;
      console.log("Resolved minter type:", minterType);

      return minterType;
    } catch (err) {
      console.error("getMinterType failed", err);
      return null;
    }
  }

  function isMinterTypeSupported(minterType) {
    if (!state.supportedMinterTypes || !state.chainId) return false;
    const chainKey = String(state.chainId);
    const supportedTypes =
      state.supportedMinterTypes[chainKey]?.supportedMinterTypes || [];
    return supportedTypes.includes(minterType);
  }

  function showMinterInfo(minterAddress, minterType) {
    if (elements.minterAddress) {
      elements.minterAddress.textContent = shortenAddress(minterAddress);
    }
    if (elements.minterType) {
      elements.minterType.textContent = minterType;
    }
    if (elements.minterInfo) {
      elements.minterInfo.hidden = false;
    }
  }

  function hideMinterInfo() {
    if (elements.minterInfo) {
      elements.minterInfo.hidden = true;
    }
  }

  function showMinterError(message) {
    if (elements.minterErrorText) {
      elements.minterErrorText.textContent = message;
    }
    if (elements.minterError) {
      elements.minterError.hidden = false;
    }
  }

  function hideMinterError() {
    if (elements.minterError) {
      elements.minterError.hidden = true;
    }
  }
})();
