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
  };

  /** wallet state */
  const state = {
    ethereum: null,
    account: null,
    chainId: null,
    projectsByChain: null,
    projectNameCache: Object.create(null),
    coreAbi: null,
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
    if (elements.projectSelect) {
      elements.projectSelect.addEventListener("change", () => {
        if (elements.loadProjectButton) {
          elements.loadProjectButton.disabled = !elements.projectSelect.value;
        }
      });
    }

    // wire events
    elements.connectButton?.addEventListener("click", connectWallet);
    elements.loadProjectButton?.addEventListener("click", () => {
      // Placeholder for the next step
      alert("TODO: Implement on-chain project loading and minting.");
    });

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
        loadProjectsJson().catch(() => {});
        loadCoreAbi().catch(() => {});
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
      const res = await fetch("./abi/IGenArt721CoreContractV3_Engine.json", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed to load ABI: ${res.status}`);
      const data = await res.json();
      state.coreAbi = data.abi;
    } catch (err) {
      console.warn("ABI load error", err);
      state.coreAbi = null;
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

    const labelPromises = projects.map((pid) => buildProjectOptionLabel(pid));
    Promise.allSettled(labelPromises).then((results) => {
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
      if (!projectDetailsAbi) {
        console.warn("projectDetails function not found in ABI");
        return null;
      }

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
})();
