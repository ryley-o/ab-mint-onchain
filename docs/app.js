import {
  encodeFunctionData,
  decodeFunctionResult,
  keccak256,
  toHex,
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
    minterRAMV0Interface: null,
    auctionStatus: null,
    allowExtraTime: null,
    numTokensInAuction: null,
    numBids: null,
    numBidsMintedTokens: null,
    numBidsErrorRefunded: null,
    lowestBidValue: null,
    minimumNextBid: null,
    revenuesCollected: null,
    totalDuration: null,
    timeRemaining: null,
    refreshStatus: null,
    currentSlotIndex: null,
    currentBidValue: null,
    createBidButton: null,
    bidError: null,
    bidErrorText: null,
    bidSuccess: null,
    txLink: null,
    slotDecrease10: null,
    slotDecrease1: null,
    slotIncrease1: null,
    slotIncrease10: null,
    disclaimerModal: null,
    experimentalBanner: null,
    acceptDisclaimer: null,
    rejectDisclaimer: null,
    loadMyBidsButton: null,
    bidScanStatus: null,
    myBidsContainer: null,
    myBidsList: null,
    bidTopupSection: null,
    selectedBidInfo: null,
    topupSlotIndex: null,
    topupBidValue: null,
    topupBidButton: null,
    topupSlotDecrease10: null,
    topupSlotDecrease1: null,
    topupSlotIncrease1: null,
    topupSlotIncrease10: null,
    topupSuccess: null,
    topupTxLink: null,
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
    minterRAMV0Abi: null,
    supportedMinterFilters: null,
    supportedMinterTypes: null,
    countdownInterval: null,
    auctionEndTime: null,
    auctionStartTime: null,
    refreshInterval: null,
    refreshCountdownInterval: null,
    currentMinterAddress: null,
    currentCoreAddress: null,
    currentProjectNumber: null,
    currentSlotIndex: 0,
    minimumSlotIndex: 0,
    currentBidValueWei: null,
    userBids: [],
    selectedBid: null,
    topupSlotIndex: 0,
    topupBidValueWei: null,
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
    elements.minterRAMV0Interface = document.getElementById(
      "minterRAMV0Interface"
    );
    elements.auctionStatus = document.getElementById("auctionStatus");
    elements.allowExtraTime = document.getElementById("allowExtraTime");
    elements.numTokensInAuction = document.getElementById("numTokensInAuction");
    elements.numBids = document.getElementById("numBids");
    elements.numBidsMintedTokens = document.getElementById(
      "numBidsMintedTokens"
    );
    elements.numBidsErrorRefunded = document.getElementById(
      "numBidsErrorRefunded"
    );
    elements.lowestBidValue = document.getElementById("lowestBidValue");
    elements.minimumNextBid = document.getElementById("minimumNextBid");
    elements.revenuesCollected = document.getElementById("revenuesCollected");
    elements.totalDuration = document.getElementById("totalDuration");
    elements.timeRemaining = document.getElementById("timeRemaining");
    elements.refreshStatus = document.getElementById("refreshStatus");
    elements.currentSlotIndex = document.getElementById("currentSlotIndex");
    elements.currentBidValue = document.getElementById("currentBidValue");
    elements.createBidButton = document.getElementById("createBidButton");
    elements.bidError = document.getElementById("bidError");
    elements.bidErrorText = document.getElementById("bidErrorText");
    elements.bidSuccess = document.getElementById("bidSuccess");
    elements.txLink = document.getElementById("txLink");
    elements.slotDecrease10 = document.getElementById("slotDecrease10");
    elements.slotDecrease1 = document.getElementById("slotDecrease1");
    elements.slotIncrease1 = document.getElementById("slotIncrease1");
    elements.slotIncrease10 = document.getElementById("slotIncrease10");
    elements.disclaimerModal = document.getElementById("disclaimerModal");
    elements.experimentalBanner = document.getElementById("experimentalBanner");
    elements.acceptDisclaimer = document.getElementById("acceptDisclaimer");
    elements.rejectDisclaimer = document.getElementById("rejectDisclaimer");
    elements.loadMyBidsButton = document.getElementById("loadMyBidsButton");
    elements.bidScanStatus = document.getElementById("bidScanStatus");
    elements.myBidsContainer = document.getElementById("myBidsContainer");
    elements.myBidsList = document.getElementById("myBidsList");
    elements.bidTopupSection = document.getElementById("bidTopupSection");
    elements.selectedBidInfo = document.getElementById("selectedBidInfo");
    elements.topupSlotIndex = document.getElementById("topupSlotIndex");
    elements.topupBidValue = document.getElementById("topupBidValue");
    elements.topupBidButton = document.getElementById("topupBidButton");
    elements.topupSlotDecrease10 = document.getElementById(
      "topupSlotDecrease10"
    );
    elements.topupSlotDecrease1 = document.getElementById("topupSlotDecrease1");
    elements.topupSlotIncrease1 = document.getElementById("topupSlotIncrease1");
    elements.topupSlotIncrease10 = document.getElementById(
      "topupSlotIncrease10"
    );
    elements.topupSuccess = document.getElementById("topupSuccess");
    elements.topupTxLink = document.getElementById("topupTxLink");

    // Only check disclaimer status if we have the elements
    if (elements.disclaimerModal && elements.experimentalBanner) {
      checkDisclaimerStatus();
    }
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
    elements.slotDecrease10?.addEventListener("click", () =>
      adjustSlotIndex(-10)
    );
    elements.slotDecrease1?.addEventListener("click", () =>
      adjustSlotIndex(-1)
    );
    elements.slotIncrease1?.addEventListener("click", () => adjustSlotIndex(1));
    elements.slotIncrease10?.addEventListener("click", () =>
      adjustSlotIndex(10)
    );
    elements.createBidButton?.addEventListener("click", createBid);
    elements.acceptDisclaimer?.addEventListener("click", acceptDisclaimer);
    elements.rejectDisclaimer?.addEventListener("click", rejectDisclaimer);
    elements.loadMyBidsButton?.addEventListener("click", loadMyBids);
    elements.topupSlotDecrease10?.addEventListener("click", () =>
      adjustTopupSlotIndex(-10)
    );
    elements.topupSlotDecrease1?.addEventListener("click", () =>
      adjustTopupSlotIndex(-1)
    );
    elements.topupSlotIncrease1?.addEventListener("click", () =>
      adjustTopupSlotIndex(1)
    );
    elements.topupSlotIncrease10?.addEventListener("click", () =>
      adjustTopupSlotIndex(10)
    );
    elements.topupBidButton?.addEventListener("click", topupBid);

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
          loadMinterRAMV0Abi(),
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
      const res = await fetch("./abi/GenArt721CoreV3_Engine.json", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed to load ABI: ${res.status}`);
      const data = await res.json();
      state.coreAbi = data.abi;
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

  async function loadMinterRAMV0Abi() {
    try {
      const res = await fetch("./abi/MinterRAMV0.json", {
        cache: "no-store",
      });
      if (!res.ok)
        throw new Error(`Failed to load MinterRAMV0 ABI: ${res.status}`);
      const data = await res.json();
      state.minterRAMV0Abi = data.abi;
    } catch (err) {
      console.error("MinterRAMV0 ABI load error", err);
      state.minterRAMV0Abi = null;
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
    if (!state.ethereum || !state.coreAbi) return null;
    try {
      const projectDetailsAbi = state.coreAbi.find(
        (item) => item.type === "function" && item.name === "projectDetails"
      );
      if (!projectDetailsAbi) return null;

      const data = encodeFunctionData({
        abi: [projectDetailsAbi],
        functionName: "projectDetails",
        args: [BigInt(projectNumber)],
      });

      const result = await state.ethereum.request({
        method: "eth_call",
        params: [{ to: contractAddress, data }, "latest"],
      });

      const decoded = decodeFunctionResult({
        abi: [projectDetailsAbi],
        functionName: "projectDetails",
        data: result,
      });

      return decoded[0]; // projectName is the first return value
    } catch (err) {
      console.warn("projectDetails eth_call failed", err);
      return null;
    }
  }

  async function loadProjectDetails() {
    if (!elements.projectSelect?.value) return;

    hideMinterInfo();
    hideMinterError();

    try {
      const projectId = elements.projectSelect.value;
      const parsed = parseProjectId(projectId);
      if (!parsed) {
        showMinterError("Invalid project ID format");
        return;
      }

      const { contractAddress, projectNumber } = parsed;

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
      showMinterInfo(
        projectMinterAddress,
        minterType,
        contractAddress,
        projectNumber
      );
    } catch (err) {
      console.error("loadProjectDetails error", err);
      showMinterError("Failed to load project details");
    }
  }

  async function getCoreMinter(contractAddress) {
    if (!state.ethereum || !state.coreAbi) return null;
    try {
      const minterContractAbi = state.coreAbi.find(
        (item) => item.type === "function" && item.name === "minterContract"
      );
      if (!minterContractAbi) return null;

      const data = encodeFunctionData({
        abi: [minterContractAbi],
        functionName: "minterContract",
        args: [],
      });

      const result = await state.ethereum.request({
        method: "eth_call",
        params: [{ to: contractAddress, data }, "latest"],
      });

      const decoded = decodeFunctionResult({
        abi: [minterContractAbi],
        functionName: "minterContract",
        data: result,
      });

      return decoded;
    } catch (err) {
      console.warn("getCoreMinter failed", err);
      return null;
    }
  }

  function isMinterFilterSupported(minterFilterAddress) {
    if (!state.supportedMinterFilters || !state.chainId) return false;
    const chainKey = String(state.chainId);
    const supportedFilters =
      state.supportedMinterFilters[chainKey]?.minterFilters || [];

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
      const getMinterForProjectAbi = state.minterFilterAbi.find(
        (item) =>
          item.type === "function" && item.name === "getMinterForProject"
      );
      if (!getMinterForProjectAbi) return null;

      const data = encodeFunctionData({
        abi: [getMinterForProjectAbi],
        functionName: "getMinterForProject",
        args: [BigInt(projectNumber), coreContractAddress],
      });

      const result = await state.ethereum.request({
        method: "eth_call",
        params: [{ to: minterFilterAddress, data }, "latest"],
      });

      const decoded = decodeFunctionResult({
        abi: [getMinterForProjectAbi],
        functionName: "getMinterForProject",
        data: result,
      });

      return decoded;
    } catch (err) {
      console.warn("getProjectMinter failed", err);
      return null;
    }
  }

  async function getMinterType(minterFilterAddress, projectMinterAddress) {
    if (!state.ethereum || !state.minterFilterAbi) return null;
    try {
      const getAllGloballyApprovedMintersAbi = state.minterFilterAbi.find(
        (item) =>
          item.type === "function" &&
          item.name === "getAllGloballyApprovedMinters"
      );
      if (!getAllGloballyApprovedMintersAbi) return null;

      const data = encodeFunctionData({
        abi: [getAllGloballyApprovedMintersAbi],
        functionName: "getAllGloballyApprovedMinters",
        args: [],
      });

      const result = await state.ethereum.request({
        method: "eth_call",
        params: [{ to: minterFilterAddress, data }, "latest"],
      });

      const decoded = decodeFunctionResult({
        abi: [getAllGloballyApprovedMintersAbi],
        functionName: "getAllGloballyApprovedMinters",
        data: result,
      });

      // Try different ways to access the data
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

      if (!Array.isArray(mintersWithTypes)) return null;

      // Find the minter in the array of structs
      const minterEntry = mintersWithTypes.find((entry) => {
        return (
          entry.minterAddress?.toLowerCase() ===
          projectMinterAddress.toLowerCase()
        );
      });

      return minterEntry ? minterEntry.minterType : null;
    } catch (err) {
      console.warn("getMinterType failed", err);
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

  async function showMinterInfo(
    minterAddress,
    minterType,
    coreContractAddress,
    projectNumber
  ) {
    if (elements.minterAddress) {
      elements.minterAddress.textContent = shortenAddress(minterAddress);
    }
    if (elements.minterType) {
      elements.minterType.textContent = minterType;
    }
    if (elements.minterInfo) {
      elements.minterInfo.hidden = false;
    }

    // Hide all minter-specific interfaces first
    hideMinterInterfaces();

    // Show minter-specific interface based on type
    if (minterType === "MinterRAMV0") {
      await showMinterRAMV0Interface(
        minterAddress,
        coreContractAddress,
        projectNumber
      );
    }
  }

  function hideMinterInterfaces() {
    // Stop any active timers
    if (state.countdownInterval) {
      clearInterval(state.countdownInterval);
      state.countdownInterval = null;
    }
    if (state.refreshInterval) {
      clearInterval(state.refreshInterval);
      state.refreshInterval = null;
    }
    if (state.refreshCountdownInterval) {
      clearInterval(state.refreshCountdownInterval);
      state.refreshCountdownInterval = null;
    }

    if (elements.minterRAMV0Interface) {
      elements.minterRAMV0Interface.hidden = true;
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

  async function showMinterRAMV0Interface(
    minterAddress,
    coreContractAddress,
    projectNumber
  ) {
    if (!elements.minterRAMV0Interface) return;

    // Show the interface
    elements.minterRAMV0Interface.hidden = false;

    try {
      // Get auction details
      const auctionDetails = await getAuctionDetails(
        minterAddress,
        coreContractAddress,
        projectNumber
      );
      if (!auctionDetails) return;

      // Determine auction state and timing
      const now = Math.floor(Date.now() / 1000);
      const startTime = Number(auctionDetails.auctionTimestampStart);
      const endTime = Number(auctionDetails.auctionTimestampEnd);

      let auctionState = "upcoming";
      if (now >= startTime && now < endTime) {
        auctionState = "live";
      } else if (now >= endTime) {
        auctionState = "completed";
      }

      // Calculate timing
      const totalDurationSeconds = endTime - startTime;
      const totalDurationText = formatDuration(totalDurationSeconds);

      // Store auction times for countdown
      state.auctionStartTime = startTime;
      state.auctionEndTime = endTime;

      // Update auction status
      if (elements.auctionStatus) {
        elements.auctionStatus.textContent =
          auctionState.charAt(0).toUpperCase() + auctionState.slice(1);
        elements.auctionStatus.className = `status-badge ${auctionState}`;
      }

      // Update timing displays
      updateElement(elements.totalDuration, totalDurationText);

      // Store current project info for refreshing
      state.currentMinterAddress = minterAddress;
      state.currentCoreAddress = coreContractAddress;
      state.currentProjectNumber = projectNumber;

      // Start countdown timer
      startCountdownTimer();

      // Start auto-refresh timer
      startAutoRefresh();

      // Update extra time badge text and style
      if (elements.allowExtraTime) {
        elements.allowExtraTime.hidden = false; // Always show the badge
        elements.allowExtraTime.textContent = auctionDetails.allowExtraTime
          ? "Extra Time Allowed"
          : "Extra Time Not Allowed";

        // Update CSS class for styling
        if (auctionDetails.allowExtraTime) {
          elements.allowExtraTime.className = "extra-time-badge allowed";
        } else {
          elements.allowExtraTime.className = "extra-time-badge not-allowed";
        }
      }

      // Update auction overview stats
      updateElement(
        elements.numTokensInAuction,
        auctionDetails.numTokensInAuction
      );
      updateElement(elements.numBids, auctionDetails.numBids);
      updateElement(
        elements.numBidsMintedTokens,
        auctionDetails.numBidsMintedTokens
      );
      updateElement(
        elements.numBidsErrorRefunded,
        auctionDetails.numBidsErrorRefunded
      );
      updateElement(
        elements.revenuesCollected,
        auctionDetails.revenuesCollected ? "Yes" : "No"
      );

      // Get current minimum bid
      const lowestBid = await getLowestBidValue(
        minterAddress,
        coreContractAddress,
        projectNumber
      );
      updateElement(
        elements.lowestBidValue,
        lowestBid ? `${formatEth(lowestBid)} ETH` : "—"
      );

      // Get minimum next bid
      const minNextBidData = await getMinimumNextBid(
        minterAddress,
        coreContractAddress,
        projectNumber
      );

      let minNextBidValue = null;
      let minSlotIndex = 0;

      if (Array.isArray(minNextBidData) && minNextBidData.length >= 2) {
        minNextBidValue = minNextBidData[0];
        minSlotIndex = Number(minNextBidData[1]);
      }

      updateElement(
        elements.minimumNextBid,
        minNextBidValue ? `${formatEth(minNextBidValue)} ETH` : "—"
      );

      // Initialize bidding controls
      state.minimumSlotIndex = minSlotIndex;
      state.currentSlotIndex = minSlotIndex;
      await updateBidDisplay();
    } catch (err) {
      console.error("Failed to load MinterRAMV0 interface:", err);
    }
  }

  async function getAuctionDetails(
    minterAddress,
    coreContractAddress,
    projectNumber
  ) {
    if (!state.ethereum || !state.minterRAMV0Abi) return null;
    try {
      const getAuctionDetailsAbi = state.minterRAMV0Abi.find(
        (item) => item.type === "function" && item.name === "getAuctionDetails"
      );
      if (!getAuctionDetailsAbi) return null;

      const data = encodeFunctionData({
        abi: [getAuctionDetailsAbi],
        functionName: "getAuctionDetails",
        args: [BigInt(projectNumber), coreContractAddress],
      });

      const result = await state.ethereum.request({
        method: "eth_call",
        params: [{ to: minterAddress, data }, "latest"],
      });

      const decoded = decodeFunctionResult({
        abi: [getAuctionDetailsAbi],
        functionName: "getAuctionDetails",
        data: result,
      });

      // Map the flat array to a structured object
      const auctionDetails = {
        auctionTimestampStart: decoded[0],
        auctionTimestampEnd: decoded[1],
        basePrice: decoded[2],
        numTokensInAuction: decoded[3],
        numBids: decoded[4],
        numBidsMintedTokens: decoded[5],
        numBidsErrorRefunded: decoded[6],
        minBidSlotIndex: decoded[7],
        allowExtraTime: decoded[8],
        adminArtistOnlyMintPeriodIfSellout: decoded[9],
        revenuesCollected: decoded[10],
        projectMinterState: decoded[11],
      };

      return auctionDetails;
    } catch (err) {
      console.warn("getAuctionDetails failed", err);
      return null;
    }
  }

  async function getLowestBidValue(
    minterAddress,
    coreContractAddress,
    projectNumber
  ) {
    if (!state.ethereum || !state.minterRAMV0Abi) return null;
    try {
      const getLowestBidValueAbi = state.minterRAMV0Abi.find(
        (item) => item.type === "function" && item.name === "getLowestBidValue"
      );
      if (!getLowestBidValueAbi) return null;

      const data = encodeFunctionData({
        abi: [getLowestBidValueAbi],
        functionName: "getLowestBidValue",
        args: [BigInt(projectNumber), coreContractAddress],
      });

      const result = await state.ethereum.request({
        method: "eth_call",
        params: [{ to: minterAddress, data }, "latest"],
      });

      const decoded = decodeFunctionResult({
        abi: [getLowestBidValueAbi],
        functionName: "getLowestBidValue",
        data: result,
      });

      return decoded;
    } catch (err) {
      console.warn("getLowestBidValue failed", err);
      return null;
    }
  }

  async function getMinimumNextBid(
    minterAddress,
    coreContractAddress,
    projectNumber
  ) {
    if (!state.ethereum || !state.minterRAMV0Abi) return null;
    try {
      const getMinimumNextBidAbi = state.minterRAMV0Abi.find(
        (item) => item.type === "function" && item.name === "getMinimumNextBid"
      );
      if (!getMinimumNextBidAbi) return null;

      const data = encodeFunctionData({
        abi: [getMinimumNextBidAbi],
        functionName: "getMinimumNextBid",
        args: [BigInt(projectNumber), coreContractAddress],
      });

      const result = await state.ethereum.request({
        method: "eth_call",
        params: [{ to: minterAddress, data }, "latest"],
      });

      const decoded = decodeFunctionResult({
        abi: [getMinimumNextBidAbi],
        functionName: "getMinimumNextBid",
        data: result,
      });

      // According to ABI, this returns [minNextBidValueInWei, minNextBidSlotIndex]
      if (Array.isArray(decoded) && decoded.length >= 1) {
        return decoded[0]; // Return just the bid value in wei
      }

      return decoded;
    } catch (err) {
      console.warn("getMinimumNextBid failed", err);
      return null;
    }
  }

  function updateElement(element, value) {
    if (element) {
      element.textContent =
        value !== undefined && value !== null ? String(value) : "—";
    }
  }

  function formatDuration(totalSeconds) {
    if (totalSeconds <= 0) return "0s";

    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(" ");
  }

  function startCountdownTimer() {
    // Clear any existing countdown
    if (state.countdownInterval) {
      clearInterval(state.countdownInterval);
    }

    // Update countdown every second
    state.countdownInterval = setInterval(updateCountdown, 1000);

    // Update immediately
    updateCountdown();
  }

  function updateCountdown() {
    if (
      !elements.timeRemaining ||
      !state.auctionStartTime ||
      !state.auctionEndTime
    )
      return;

    const now = Math.floor(Date.now() / 1000);
    const startTime = state.auctionStartTime;
    const endTime = state.auctionEndTime;

    let timeRemainingText;
    let auctionState;

    if (now < startTime) {
      // Upcoming
      const timeToStart = startTime - now;
      timeRemainingText = `Starts in ${formatDuration(timeToStart)}`;
      auctionState = "upcoming";
    } else if (now < endTime) {
      // Live
      const timeToEnd = endTime - now;
      timeRemainingText = formatDuration(timeToEnd);
      auctionState = "live";
    } else {
      // Completed
      timeRemainingText = "Auction ended";
      auctionState = "completed";
      // Stop the countdown
      if (state.countdownInterval) {
        clearInterval(state.countdownInterval);
        state.countdownInterval = null;
      }
    }

    // Update time remaining
    updateElement(elements.timeRemaining, timeRemainingText);

    // Update status badge if it changed
    if (elements.auctionStatus) {
      const currentClass = elements.auctionStatus.className;
      const newClass = `status-badge ${auctionState}`;
      if (currentClass !== newClass) {
        elements.auctionStatus.textContent =
          auctionState.charAt(0).toUpperCase() + auctionState.slice(1);
        elements.auctionStatus.className = newClass;
      }
    }
  }

  function startAutoRefresh() {
    // Clear any existing refresh timers
    if (state.refreshInterval) {
      clearInterval(state.refreshInterval);
    }
    if (state.refreshCountdownInterval) {
      clearInterval(state.refreshCountdownInterval);
    }

    let refreshCountdown = 30;

    // Update refresh countdown every second
    state.refreshCountdownInterval = setInterval(() => {
      refreshCountdown--;
      if (elements.refreshStatus) {
        if (refreshCountdown > 0) {
          elements.refreshStatus.textContent = `Refreshing in ${refreshCountdown}s`;
        } else {
          elements.refreshStatus.textContent = "Refreshing...";
        }
      }
    }, 1000);

    // Refresh minter data every 30 seconds
    state.refreshInterval = setInterval(async () => {
      if (
        state.currentMinterAddress &&
        state.currentCoreAddress &&
        state.currentProjectNumber !== null
      ) {
        await refreshMinterData();
        refreshCountdown = 30; // Reset countdown
      }
    }, 30000);

    // Set initial countdown display
    if (elements.refreshStatus) {
      elements.refreshStatus.textContent = `Refreshing in ${refreshCountdown}s`;
    }
  }

  async function refreshMinterData() {
    if (
      !state.currentMinterAddress ||
      !state.currentCoreAddress ||
      state.currentProjectNumber === null
    )
      return;

    try {
      // Get fresh auction details
      const auctionDetails = await getAuctionDetails(
        state.currentMinterAddress,
        state.currentCoreAddress,
        state.currentProjectNumber
      );
      if (!auctionDetails) return;

      // Update auction overview stats
      updateElement(
        elements.numTokensInAuction,
        auctionDetails.numTokensInAuction
      );
      updateElement(elements.numBids, auctionDetails.numBids);
      updateElement(
        elements.numBidsMintedTokens,
        auctionDetails.numBidsMintedTokens
      );
      updateElement(
        elements.numBidsErrorRefunded,
        auctionDetails.numBidsErrorRefunded
      );
      updateElement(
        elements.revenuesCollected,
        auctionDetails.revenuesCollected ? "Yes" : "No"
      );

      // Get fresh bid values
      const lowestBid = await getLowestBidValue(
        state.currentMinterAddress,
        state.currentCoreAddress,
        state.currentProjectNumber
      );
      updateElement(
        elements.lowestBidValue,
        lowestBid ? `${formatEth(lowestBid)} ETH` : "—"
      );

      const minNextBid = await getMinimumNextBid(
        state.currentMinterAddress,
        state.currentCoreAddress,
        state.currentProjectNumber
      );
      updateElement(
        elements.minimumNextBid,
        minNextBid ? `${formatEth(minNextBid)} ETH` : "—"
      );
    } catch (err) {
      console.warn("Failed to refresh minter data", err);
    }
  }

  async function adjustSlotIndex(delta) {
    let newSlotIndex = state.currentSlotIndex + delta;

    // Clamp to valid bounds instead of rejecting
    if (newSlotIndex < state.minimumSlotIndex) {
      newSlotIndex = state.minimumSlotIndex;
    } else if (newSlotIndex > 511) {
      newSlotIndex = 511;
    }

    hideBidError();
    state.currentSlotIndex = newSlotIndex;
    await updateBidDisplay();
  }

  async function updateBidDisplay() {
    if (
      !state.currentMinterAddress ||
      !state.currentCoreAddress ||
      state.currentProjectNumber === null
    )
      return;

    // Update slot index display
    if (elements.currentSlotIndex) {
      elements.currentSlotIndex.textContent = state.currentSlotIndex;
    }

    // Update button states
    updateSlotButtons();

    // Get bid value for current slot
    const bidValue = await getSlotIndexToBidValue(
      state.currentMinterAddress,
      state.currentCoreAddress,
      state.currentProjectNumber,
      state.currentSlotIndex
    );

    if (bidValue) {
      state.currentBidValueWei = bidValue;
      updateElement(elements.currentBidValue, `${formatEth(bidValue)} ETH`);

      // Enable bid button if we have a valid bid value
      if (elements.createBidButton) {
        elements.createBidButton.disabled = false;
      }
    } else {
      state.currentBidValueWei = null;
      updateElement(elements.currentBidValue, "—");
      if (elements.createBidButton) {
        elements.createBidButton.disabled = true;
      }
    }
  }

  function updateSlotButtons() {
    const canDecrease1 = state.currentSlotIndex > state.minimumSlotIndex;
    const canDecrease10 = state.currentSlotIndex > state.minimumSlotIndex; // Can always decrease if not at minimum
    const canIncrease1 = state.currentSlotIndex < 511;
    const canIncrease10 = state.currentSlotIndex < 511; // Can always increase if not at maximum

    if (elements.slotDecrease1) elements.slotDecrease1.disabled = !canDecrease1;
    if (elements.slotDecrease10)
      elements.slotDecrease10.disabled = !canDecrease10;
    if (elements.slotIncrease1) elements.slotIncrease1.disabled = !canIncrease1;
    if (elements.slotIncrease10)
      elements.slotIncrease10.disabled = !canIncrease10;
  }

  async function getSlotIndexToBidValue(
    minterAddress,
    coreContractAddress,
    projectNumber,
    slotIndex
  ) {
    if (!state.ethereum || !state.minterRAMV0Abi) return null;
    try {
      const slotIndexToBidValueAbi = state.minterRAMV0Abi.find(
        (item) =>
          item.type === "function" && item.name === "slotIndexToBidValue"
      );
      if (!slotIndexToBidValueAbi) return null;

      const data = encodeFunctionData({
        abi: [slotIndexToBidValueAbi],
        functionName: "slotIndexToBidValue",
        args: [BigInt(projectNumber), coreContractAddress, BigInt(slotIndex)],
      });

      const result = await state.ethereum.request({
        method: "eth_call",
        params: [{ to: minterAddress, data }, "latest"],
      });

      const decoded = decodeFunctionResult({
        abi: [slotIndexToBidValueAbi],
        functionName: "slotIndexToBidValue",
        data: result,
      });

      return decoded;
    } catch (err) {
      console.warn("getSlotIndexToBidValue failed", err);
      return null;
    }
  }

  async function createBid() {
    if (!state.ethereum || !state.minterRAMV0Abi || !state.currentBidValueWei) {
      showBidError("Cannot place bid - missing data");
      return;
    }

    try {
      hideBidError();
      hideBidSuccess();

      const createBidAbi = state.minterRAMV0Abi.find(
        (item) => item.type === "function" && item.name === "createBid"
      );
      if (!createBidAbi) {
        showBidError("createBid function not found in ABI");
        return;
      }

      const data = encodeFunctionData({
        abi: [createBidAbi],
        functionName: "createBid",
        args: [
          BigInt(state.currentProjectNumber),
          state.currentCoreAddress,
          state.currentSlotIndex, // uint16, not BigInt
        ],
      });

      const txHash = await state.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: state.account,
            to: state.currentMinterAddress,
            data: data,
            value: "0x" + state.currentBidValueWei.toString(16),
          },
        ],
      });

      console.log("Bid transaction sent:", txHash);

      // Show success message with Etherscan link
      showBidSuccess(txHash);

      // Refresh data after successful bid
      setTimeout(() => refreshMinterData(), 2000);
    } catch (err) {
      console.error("createBid failed", err);
      showBidError(err.message || "Failed to place bid");
    }
  }

  function showBidError(message) {
    if (elements.bidErrorText) {
      elements.bidErrorText.textContent = message;
    }
    if (elements.bidError) {
      elements.bidError.hidden = false;
    }
  }

  function hideBidError() {
    if (elements.bidError) {
      elements.bidError.hidden = true;
    }
  }

  async function loadMyBids() {
    if (
      !state.account ||
      !state.currentMinterAddress ||
      !state.currentCoreAddress ||
      state.currentProjectNumber === null
    ) {
      updateScanStatus("Connect wallet and load project first");
      return;
    }

    if (!state.auctionStartTime) {
      updateScanStatus("Auction data not loaded");
      return;
    }

    try {
      updateScanStatus("Scanning blockchain logs...");

      // Get current block number
      const currentBlockHex = await state.ethereum.request({
        method: "eth_blockNumber",
      });
      const currentBlock = parseInt(currentBlockHex, 16);

      // Get block number for auction start (approximate)
      const auctionStartBlock = await getBlockNumberFromTimestamp(
        state.auctionStartTime
      );

      console.log("Block range for scanning:", {
        auctionStartTime: state.auctionStartTime,
        auctionStartBlock,
        currentBlock,
        totalBlocks: currentBlock - auctionStartBlock,
      });

      updateScanStatus(
        `Scanning blocks ${auctionStartBlock} to ${currentBlock}...`
      );

      // Scan logs in chunks of 10k blocks
      const userBids = await scanBidLogs(auctionStartBlock, currentBlock);

      console.log("Final processed user bids:", userBids);
      updateScanStatus(`Found ${userBids.length} active bids`);
      state.userBids = userBids;

      displayUserBids(userBids);
    } catch (err) {
      console.error("Failed to load user bids", err);
      updateScanStatus("Failed to scan bids");
    }
  }

  async function getBlockNumberFromTimestamp(timestamp) {
    // Rough estimate: 12 seconds per block average
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - timestamp;
    const estimatedBlocks = Math.floor(timeDiff / 12);

    const currentBlockHex = await state.ethereum.request({
      method: "eth_blockNumber",
    });
    const currentBlock = parseInt(currentBlockHex, 16);

    return Math.max(currentBlock - estimatedBlocks, 0);
  }

  async function scanBidLogs(fromBlock, toBlock) {
    const allBids = new Map(); // bidId -> bid data
    const processedBlocks = new Set(); // Track processed blocks to avoid duplicates
    const chunkSize = 10000;
    const maxLogsThreshold = 500;

    let currentStart = fromBlock;

    while (currentStart <= toBlock) {
      const end = Math.min(currentStart + chunkSize - 1, toBlock);
      updateScanStatus(`Scanning blocks ${currentStart} to ${end}...`);

      // Scan for BidCreated events
      const bidCreatedLogs = await getBidCreatedLogs(currentStart, end);
      console.log(`BidCreated logs (${currentStart}-${end}):`, bidCreatedLogs);

      bidCreatedLogs.forEach((log) => {
        const blockKey = `created-${log.blockNumber}-${log.transactionIndex}-${log.logIndex}`;
        if (!processedBlocks.has(blockKey)) {
          processedBlocks.add(blockKey);
          console.log("Processing BidCreated log:", log);
          console.log(
            "Comparing bidder:",
            log.bidder.toLowerCase(),
            "vs account:",
            state.account.toLowerCase()
          );
          if (log.bidder.toLowerCase() === state.account.toLowerCase()) {
            console.log("Adding bid to allBids:", log.bidId);
            allBids.set(log.bidId, {
              bidId: log.bidId,
              slotIndex: log.slotIndex,
              bidder: log.bidder,
              isRemoved: false,
            });
          }
        }
      });

      // Scan for BidRemoved events
      const bidRemovedLogs = await getBidRemovedLogs(currentStart, end);
      console.log(`BidRemoved logs (${currentStart}-${end}):`, bidRemovedLogs);
      bidRemovedLogs.forEach((log) => {
        const blockKey = `removed-${log.blockNumber}-${log.transactionIndex}-${log.logIndex}`;
        if (!processedBlocks.has(blockKey) && allBids.has(log.bidId)) {
          processedBlocks.add(blockKey);
          console.log("Marking bid as removed:", log.bidId);
          allBids.get(log.bidId).isRemoved = true;
        }
      });

      // Scan for BidToppedUp events
      const bidToppedUpLogs = await getBidToppedUpLogs(currentStart, end);
      console.log(
        `BidToppedUp logs (${currentStart}-${end}):`,
        bidToppedUpLogs
      );
      bidToppedUpLogs.forEach((log) => {
        const blockKey = `toppedup-${log.blockNumber}-${log.transactionIndex}-${log.logIndex}`;
        if (!processedBlocks.has(blockKey) && allBids.has(log.bidId)) {
          processedBlocks.add(blockKey);
          console.log(
            "Updating bid slot index:",
            log.bidId,
            "to",
            log.newSlotIndex
          );
          allBids.get(log.bidId).slotIndex = log.newSlotIndex;
        }
      });

      // Smart advancement: if we got too many logs, advance more carefully
      const totalLogs =
        bidCreatedLogs.length + bidRemovedLogs.length + bidToppedUpLogs.length;
      console.log(`Total logs in chunk: ${totalLogs}`);

      if (totalLogs > maxLogsThreshold) {
        // Find the highest block number in this chunk's logs
        const allLogs = [
          ...bidCreatedLogs,
          ...bidRemovedLogs,
          ...bidToppedUpLogs,
        ];
        const maxBlockInChunk = Math.max(
          ...allLogs.map((log) => parseInt(log.blockNumber, 16))
        );
        console.log(
          `High log count (${totalLogs}), advancing to block ${maxBlockInChunk + 1} instead of ${end + 1}`
        );
        currentStart = maxBlockInChunk + 1;
      } else {
        currentStart = end + 1;
      }
    }

    console.log("scanBidLogs summary:", {
      totalBidsFound: allBids.size,
      allBidsMap: Array.from(allBids.entries()),
      connectedAccount: state.account,
    });

    // Return only active (non-removed) bids
    const activeBids = Array.from(allBids.values()).filter(
      (bid) => !bid.isRemoved
    );
    console.log("Active bids after filtering:", activeBids);
    return activeBids;
  }

  async function getBidCreatedLogs(fromBlock, toBlock) {
    console.log("getBidCreatedLogs params:", {
      fromBlock: "0x" + fromBlock.toString(16),
      toBlock: "0x" + toBlock.toString(16),
      address: state.currentMinterAddress,
      projectId:
        "0x" + state.currentProjectNumber.toString(16).padStart(64, "0"),
      coreContract:
        "0x" +
        state.currentCoreAddress.slice(2).toLowerCase().padStart(64, "0"),
      eventSig: keccak256(
        toHex("BidCreated(uint256,address,uint256,uint256,address)")
      ),
    });

    const logs = await state.ethereum.request({
      method: "eth_getLogs",
      params: [
        {
          fromBlock: "0x" + fromBlock.toString(16),
          toBlock: "0x" + toBlock.toString(16),
          address: state.currentMinterAddress,
          topics: [
            keccak256(
              toHex("BidCreated(uint256,address,uint256,uint256,address)")
            ),
            "0x" + state.currentProjectNumber.toString(16).padStart(64, "0"),
            "0x" +
              state.currentCoreAddress.slice(2).toLowerCase().padStart(64, "0"),
          ],
        },
      ],
    });

    console.log(`Raw BidCreated logs (${fromBlock}-${toBlock}):`, logs);

    const parsedLogs = logs.map((log) => {
      const parsed = {
        slotIndex: parseInt(log.data.slice(2, 66), 16), // First 32 bytes
        bidId: parseInt(log.data.slice(66, 130), 16), // Second 32 bytes
        bidder: "0x" + log.data.slice(154, 194), // Third 32 bytes (address is last 20 bytes)
        blockNumber: log.blockNumber,
        transactionIndex: log.transactionIndex,
        logIndex: log.logIndex,
      };
      console.log("Parsed BidCreated log:", parsed);
      return parsed;
    });

    return parsedLogs;
  }

  async function getBidRemovedLogs(fromBlock, toBlock) {
    const logs = await state.ethereum.request({
      method: "eth_getLogs",
      params: [
        {
          fromBlock: "0x" + fromBlock.toString(16),
          toBlock: "0x" + toBlock.toString(16),
          address: state.currentMinterAddress,
          topics: [
            keccak256(toHex("BidRemoved(uint256,address,uint256)")),
            "0x" + state.currentProjectNumber.toString(16).padStart(64, "0"),
            "0x" +
              state.currentCoreAddress.slice(2).toLowerCase().padStart(64, "0"),
          ],
        },
      ],
    });

    console.log(`Raw BidRemoved logs (${fromBlock}-${toBlock}):`, logs);

    return logs.map((log) => {
      const parsed = {
        bidId: parseInt(log.data.slice(2, 66), 16), // First 32 bytes in data
        blockNumber: log.blockNumber,
        transactionIndex: log.transactionIndex,
        logIndex: log.logIndex,
      };
      console.log("Parsed BidRemoved log:", parsed);
      return parsed;
    });
  }

  async function getBidToppedUpLogs(fromBlock, toBlock) {
    const logs = await state.ethereum.request({
      method: "eth_getLogs",
      params: [
        {
          fromBlock: "0x" + fromBlock.toString(16),
          toBlock: "0x" + toBlock.toString(16),
          address: state.currentMinterAddress,
          topics: [
            keccak256(toHex("BidToppedUp(uint256,address,uint256,uint256)")),
            "0x" + state.currentProjectNumber.toString(16).padStart(64, "0"),
            "0x" +
              state.currentCoreAddress.slice(2).toLowerCase().padStart(64, "0"),
          ],
        },
      ],
    });

    console.log(`Raw BidToppedUp logs (${fromBlock}-${toBlock}):`, logs);

    return logs.map((log) => {
      const parsed = {
        bidId: parseInt(log.data.slice(2, 66), 16), // First 32 bytes in data
        newSlotIndex: parseInt(log.data.slice(66, 130), 16), // Second 32 bytes in data
        blockNumber: log.blockNumber,
        transactionIndex: log.transactionIndex,
        logIndex: log.logIndex,
      };
      console.log("Parsed BidToppedUp log:", parsed);
      return parsed;
    });
  }

  function updateScanStatus(message) {
    if (elements.bidScanStatus) {
      elements.bidScanStatus.textContent = message;
    }
  }

  async function displayUserBids(bids) {
    if (!elements.myBidsList || !elements.myBidsContainer) return;

    elements.myBidsList.innerHTML = "";

    if (bids.length === 0) {
      elements.myBidsContainer.hidden = true;
      return;
    }

    elements.myBidsContainer.hidden = false;

    // Get bid values for all bids
    for (const bid of bids) {
      const bidValue = await getSlotIndexToBidValue(
        state.currentMinterAddress,
        state.currentCoreAddress,
        state.currentProjectNumber,
        bid.slotIndex
      );

      const bidElement = document.createElement("div");
      bidElement.className = "bid-item";
      bidElement.innerHTML = `
        <div class="bid-info">
          <div class="bid-id">Bid #${bid.bidId}</div>
          <div class="bid-details">Slot ${bid.slotIndex} | ${bidValue ? formatEth(bidValue) + " ETH" : "—"}</div>
        </div>
      `;

      bidElement.addEventListener("click", () => selectBid(bid));
      elements.myBidsList.appendChild(bidElement);
    }
  }

  function selectBid(bid) {
    // Update selected bid
    state.selectedBid = bid;

    // Update UI selection
    document.querySelectorAll(".bid-item").forEach((item) => {
      item.classList.remove("selected");
    });
    event.target.closest(".bid-item").classList.add("selected");

    // Show topup section
    if (elements.bidTopupSection) {
      elements.bidTopupSection.hidden = false;
    }

    // Set initial topup slot to current + 1
    state.topupSlotIndex = bid.slotIndex + 1;

    // Update displays
    updateSelectedBidInfo();
    updateTopupDisplay();
  }

  function updateSelectedBidInfo() {
    if (!state.selectedBid || !elements.selectedBidInfo) return;
    elements.selectedBidInfo.textContent = `Bid #${state.selectedBid.bidId} (Slot ${state.selectedBid.slotIndex})`;
  }

  async function updateTopupDisplay() {
    if (!state.selectedBid) return;

    // Update slot index display
    if (elements.topupSlotIndex) {
      elements.topupSlotIndex.textContent = state.topupSlotIndex;
    }

    // Update button states
    updateTopupSlotButtons();

    // Get bid value for current bid slot
    const currentBidValue = await getSlotIndexToBidValue(
      state.currentMinterAddress,
      state.currentCoreAddress,
      state.currentProjectNumber,
      state.selectedBid.slotIndex
    );

    // Get bid value for new topup slot
    const newBidValue = await getSlotIndexToBidValue(
      state.currentMinterAddress,
      state.currentCoreAddress,
      state.currentProjectNumber,
      state.topupSlotIndex
    );

    if (newBidValue && currentBidValue) {
      // Calculate the difference (additional amount needed)
      const additionalAmount = newBidValue - currentBidValue;
      state.topupBidValueWei = additionalAmount;

      updateElement(
        elements.topupBidValue,
        `+${formatEth(additionalAmount)} ETH`
      );

      if (elements.topupBidButton) {
        elements.topupBidButton.disabled = additionalAmount <= 0;
      }
    } else {
      state.topupBidValueWei = null;
      updateElement(elements.topupBidValue, "—");
      if (elements.topupBidButton) {
        elements.topupBidButton.disabled = true;
      }
    }
  }

  async function adjustTopupSlotIndex(delta) {
    if (!state.selectedBid) return;

    let newSlotIndex = state.topupSlotIndex + delta;

    // Clamp to valid bounds (must be greater than current bid slot)
    const minSlot = state.selectedBid.slotIndex + 1;
    if (newSlotIndex < minSlot) {
      newSlotIndex = minSlot;
    } else if (newSlotIndex > 511) {
      newSlotIndex = 511;
    }

    state.topupSlotIndex = newSlotIndex;
    await updateTopupDisplay();
  }

  function updateTopupSlotButtons() {
    if (!state.selectedBid) return;

    const minSlot = state.selectedBid.slotIndex + 1;
    const canDecrease1 = state.topupSlotIndex > minSlot;
    const canDecrease10 = state.topupSlotIndex > minSlot;
    const canIncrease1 = state.topupSlotIndex < 511;
    const canIncrease10 = state.topupSlotIndex < 511;

    if (elements.topupSlotDecrease1)
      elements.topupSlotDecrease1.disabled = !canDecrease1;
    if (elements.topupSlotDecrease10)
      elements.topupSlotDecrease10.disabled = !canDecrease10;
    if (elements.topupSlotIncrease1)
      elements.topupSlotIncrease1.disabled = !canIncrease1;
    if (elements.topupSlotIncrease10)
      elements.topupSlotIncrease10.disabled = !canIncrease10;
  }

  async function topupBid() {
    if (
      !state.selectedBid ||
      !state.topupBidValueWei ||
      !state.ethereum ||
      !state.minterRAMV0Abi
    ) {
      return;
    }

    try {
      hideTopupSuccess();

      const topUpBidAbi = state.minterRAMV0Abi.find(
        (item) => item.type === "function" && item.name === "topUpBid"
      );
      if (!topUpBidAbi) {
        console.error("topUpBid function not found in ABI");
        return;
      }

      const data = encodeFunctionData({
        abi: [topUpBidAbi],
        functionName: "topUpBid",
        args: [
          BigInt(state.currentProjectNumber),
          state.currentCoreAddress,
          BigInt(state.selectedBid.bidId),
          state.topupSlotIndex,
        ],
      });

      const txHash = await state.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: state.account,
            to: state.currentMinterAddress,
            data: data,
            value: "0x" + state.topupBidValueWei.toString(16),
          },
        ],
      });

      console.log("Top-up transaction sent:", txHash);
      showTopupSuccess(txHash);

      // Refresh bids after successful topup (wait longer for mining)
      setTimeout(() => {
        console.log("Refreshing bids after top-up transaction");
        loadMyBids();
      }, 15000);
    } catch (err) {
      console.error("topupBid failed", err);
      showBidError(err.message || "Failed to top up bid");
    }
  }

  function showBidSuccess(txHash) {
    if (elements.txLink && elements.bidSuccess) {
      const etherscanUrl = getEtherscanUrl(txHash);
      elements.txLink.href = etherscanUrl;
      elements.bidSuccess.hidden = false;
    }
  }

  function hideBidSuccess() {
    if (elements.bidSuccess) {
      elements.bidSuccess.hidden = true;
    }
  }

  function showTopupSuccess(txHash) {
    if (elements.topupTxLink && elements.topupSuccess) {
      const etherscanUrl = getEtherscanUrl(txHash);
      elements.topupTxLink.href = etherscanUrl;
      elements.topupSuccess.hidden = false;
    }
  }

  function hideTopupSuccess() {
    if (elements.topupSuccess) {
      elements.topupSuccess.hidden = true;
    }
  }

  function getEtherscanUrl(txHash) {
    const baseUrl =
      state.chainId === 1
        ? "https://etherscan.io"
        : "https://sepolia.etherscan.io";
    return `${baseUrl}/tx/${txHash}`;
  }

  function acceptDisclaimer() {
    console.log("acceptDisclaimer called");
    if (elements.disclaimerModal) {
      console.log("Hiding disclaimer modal");
      elements.disclaimerModal.style.display = "none";
    }
    if (elements.experimentalBanner) {
      console.log("Showing experimental banner");
      elements.experimentalBanner.style.display = "block";
    }
    // Store acceptance in localStorage
    localStorage.setItem("ab-minter-disclaimer-accepted", "true");
    console.log("Disclaimer acceptance stored");
  }

  function rejectDisclaimer() {
    // Close the page or show a message
    if (
      confirm(
        "You must accept the disclaimer to use this experimental software. Close this page?"
      )
    ) {
      window.close();
    }
  }

  // Check if disclaimer was already accepted
  function checkDisclaimerStatus() {
    const accepted = localStorage.getItem("ab-minter-disclaimer-accepted");
    console.log("checkDisclaimerStatus - accepted:", accepted);
    if (accepted === "true") {
      console.log("User previously accepted disclaimer, hiding modal");
      if (elements.disclaimerModal) {
        elements.disclaimerModal.style.display = "none";
      }
      if (elements.experimentalBanner) {
        elements.experimentalBanner.style.display = "block";
      }
    } else {
      console.log("No previous acceptance found, showing modal");
    }
  }
})();
