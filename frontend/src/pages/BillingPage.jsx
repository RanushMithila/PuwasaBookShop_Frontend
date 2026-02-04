import { useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash.debounce";
import BillingItemRow from "../components/BillingItemRow";
import SummaryBox from "../components/SummaryBox";
import useBillingStore from "../store/BillingStore";
import Receipt from "../components/Receipt";
import CashInOutModal from "../components/CashInOutModal";
import CashCountModal from "../components/CashCountModal";
import TemporaryBillsModal from "../components/TemporaryBillsModal";
import SearchByNameModal from "../components/SearchByNameModal";
import OpeningAmountModal from "../components/OpeningAmountModal";
import useAuthStore from "../store/AuthStore";
import TokenService from "../services/TokenService";
import {
  createBill,
  addBillDetails,
  completeBill,
  getItemByBarcode,
  getItemQuantity,
  getBill,
  cancelBill,
  getTemporaryBills,
  getInventory,
} from "../services/BillingService";
import {
  checkRegisterOpen,
  setOpeningAmount,
} from "../services/CashRegisterService";
import { getUsers } from "../services/UserService";
import { getCustomerByPhone } from "../services/CustomerService";

import AlertModal from "../components/AlertModal";

const BillingPage = () => {
  // Billing store
  const selectedItems = useBillingStore((s) => s.selectedItems);
  const addItem = useBillingStore((s) => s.addItem);
  const removeItem = useBillingStore((s) => s.removeItem);
  const setCurrentBillId = useBillingStore((s) => s.setCurrentBillId);
  const resetTransaction = useBillingStore((s) => s.resetTransaction);
  const currentBillId = useBillingStore((s) => s.currentBillId);

  // Auth store (tokens and device ID)
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const location = useAuthStore((s) => s.location);
  const storedLocationID = useAuthStore((s) => s.LocationID);
  const LocationID = storedLocationID ? parseInt(storedLocationID, 10) : 1; // Fallback to 1 for safety
  const deviceId = useAuthStore((s) => s.deviceId);

  // UI state
  const [showCashInOut, setShowCashInOut] = useState(false);
  const [showCashCount, setShowCashCount] = useState(false);
  const [showTemporaryBills, setShowTemporaryBills] = useState(false);
  const [showSearchByNameModal, setShowSearchByNameModal] = useState(false);
  const [showOpeningAmountModal, setShowOpeningAmountModal] = useState(false);
  const [isOpeningAmountLoading, setIsOpeningAmountLoading] = useState(false);
  const [registerSessionId, setRegisterSessionId] = useState(null);
  const [temporaryBills, setTemporaryBills] = useState([]);
  const [helpers, setHelpers] = useState([]);
  const [selectedHelperID, setSelectedHelperID] = useState(null);
  const [helperSearchTerm, setHelperSearchTerm] = useState("");
  const [showHelperSuggestions, setShowHelperSuggestions] = useState(false);
  const [helperHighlightIndex, setHelperHighlightIndex] = useState(-1);
  const [loadingTempBills, setLoadingTempBills] = useState(false);
  const [tempBillsError, setTempBillsError] = useState("");
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [customerResults, setCustomerResults] = useState([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [customerHighlightIndex, setCustomerHighlightIndex] = useState(-1);

  // Alert Modal State
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // Customer
  const [customerName, setCustomerName] = useState("Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCustomerID, setSelectedCustomerID] = useState(1);
  const locationName = "Polonnaruwa";

  // Search / item code and suggestions
  const [itemCode, setItemCode] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // Payment
  const [cashPayAmount, setCashPayAmount] = useState("0.00");
  const [cardAmount, setCardAmount] = useState("0.00");
  const [chequeAmount, setChequeAmount] = useState("0.00");
  const [creditBalance, setCreditBalance] = useState(0);
  const [lastBillBalance, setLastBillBalance] = useState(0); // Persistent last bill balance
  const [userEditedCash, setUserEditedCash] = useState(false);
  const [userEditedCard, setUserEditedCard] = useState(false);
  const [userEditedCheque, setUserEditedCheque] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // API actions (save/complete)
  const [isPrinting, setIsPrinting] = useState(false); // External print/python action

  const receiptRef = useRef();
  const itemCodeRef = useRef();
  const cashInputRef = useRef();
  const cardInputRef = useRef();
  const chequeInputRef = useRef();
  const helperSearchRef = useRef();
  const customerSearchRef = useRef();
  const saveButtonRef = useRef();
  const printButtonRef = useRef();
  const rowRefs = useRef(new Map());
  const registerRowRef = useCallback((id, refs) => {
    rowRefs.current.set(id, refs);
  }, []);
  const [inputsLocked, setInputsLocked] = useState(false);

  // Computed totals from store
  const subtotal = useBillingStore((s) => s.getSubtotal());
  const totalDiscount = useBillingStore((s) => s.getTotalDiscount());
  const total = useBillingStore((s) => s.getTotal());
  const itemCount = useBillingStore((s) => s.getTotalItems());

  const handleCloseAlert = () => {
    setAlertConfig({ ...alertConfig, isOpen: false });
    // Clear input and focus item code
    setItemCode("");
    setSuggestions([]);
    setHighlightIndex(-1);
    setInputsLocked(false);
    setTimeout(() => {
      itemCodeRef.current?.focus();
      itemCodeRef.current?.select?.();
    }, 0);
  };

  // --- JWT decode helpers ---
  const decodeJWT = (token) => {
    if (!token || typeof token !== "string" || token.split(".").length < 2)
      return null;
    try {
      const base64Url = token.split(".").slice(0, 2).join("."); // Only need valid parts? Actually standard is 3 parts.
      // Revert to original safer split[1] check
      const base64UrlPayload = token.split(".")[1];
      // Base64URL -> Base64
      let base64 = base64UrlPayload.replace(/-/g, "+").replace(/_/g, "/");
      // Pad if needed
      const pad = base64.length % 4;
      if (pad) base64 += "=".repeat(4 - pad);
      const json = atob(base64);
      return JSON.parse(json);
    } catch (err) {
      console.warn("Failed to decode JWT:", err);
      return null;
    }
  };

  const extractRole = (token) => {
    const payload = decodeJWT(token);
    if (!payload) return "USER";
    return (
      payload.role ||
      payload.Role ||
      payload.roles ||
      payload.authorities ||
      "USER"
    );
  };

  const loginRole = extractRole(accessToken);

  // Filtered helpers for searchable dropdown
  const filteredHelpers = helpers.filter((h) => {
    const fullName = `${h.firstname} ${h.lastname}`.toLowerCase();
    return fullName.includes(helperSearchTerm.toLowerCase());
  });

  // Click outside to close helper suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        helperSearchRef.current &&
        !helperSearchRef.current.contains(event.target)
      ) {
        setShowHelperSuggestions(false);
      }
      if (
        customerSearchRef.current &&
        !customerSearchRef.current.contains(event.target)
      ) {
        setShowCustomerSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Extract cashier name from token
  const getCashierName = () => {
    if (!accessToken) return "";
    const details = TokenService.getUserDetails(accessToken);
    return details?.sub || details?.username || details?.name || "Unknown";
  };
  const cashierName = getCashierName();

  // Removed automatic bill creation on mount to avoid empty placeholder bills.

  // Focus Item Code input on mount (page load or after navigation)
  useEffect(() => {
    const t = setTimeout(() => itemCodeRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, []);

  // Fetch users/helpers on mount
  useEffect(() => {
    const fetchHelpers = async () => {
      try {
        const resp = await getUsers();
        if (resp && resp.status === true && Array.isArray(resp.data)) {
          setHelpers(resp.data);
        }
      } catch (err) {
        console.error("Failed to fetch helpers:", err);
      }
    };
    fetchHelpers();
  }, []);

  // Helper functions
  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    let formatted = "";
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length > 3) formatted += " " + digits.slice(3, 6);
    if (digits.length > 6) formatted += " " + digits.slice(6, 10);
    return formatted;
  };

  // Customer phone search logic
  useEffect(() => {
    const rawDigits = customerPhone.replace(/\D/g, "");

    // Protection against race conditions (stale requests)
    let isActive = true;

    if (rawDigits.length >= 5) {
      const fetchCustomer = async () => {
        console.log(`[CustomerSearch] Fetching for digits: ${rawDigits}`);
        setIsSearchingCustomer(true);
        // setShowCustomerSuggestions(true); // Moved to onChange/onFocus to prevent reappearing after selection
        try {
          const resp = await getCustomerByPhone(rawDigits);

          if (!isActive) {
            console.log(
              `[CustomerSearch] Ignoring stale response for: ${rawDigits}`,
            );
            return;
          }

          console.log("[CustomerSearch] Full Response:", resp);

          if (resp && resp.data) {
            let customers = [];
            // Handle array or object, but ignore empty objects
            if (Array.isArray(resp.data)) {
              customers = resp.data.filter(
                (c) => c && Object.keys(c).length > 0,
              );
            } else if (
              typeof resp.data === "object" &&
              Object.keys(resp.data).length > 0
            ) {
              customers = [resp.data];
            }

            console.log("[CustomerSearch] Processed Customers:", customers);

            // Sort by first name
            customers.sort((a, b) =>
              (a.firstname || "").localeCompare(b.firstname || ""),
            );
            setCustomerResults(customers);

            // If pinpointed exactly, we auto-fill the NAME but we KEEP THE LIST OPEN
            if (
              customers.length === 1 &&
              customers[0].phone === rawDigits &&
              rawDigits.length === 10
            ) {
              console.log(
                "[CustomerSearch] Exact match found, auto-filling name.",
              );
              setCustomerName(customers[0].firstname || "Customer");
              setSelectedCustomerID(customers[0].customerid || 1);
              setShowCustomerSuggestions(false);
            }
          } else {
            console.log(
              "[CustomerSearch] Response received but no data field found",
            );
            setCustomerResults([]);
          }
        } catch (err) {
          if (!isActive) return;
          console.error("[CustomerSearch] Error:", err);
          setCustomerResults([]);
        } finally {
          if (isActive) {
            setIsSearchingCustomer(false);
          }
        }
      };

      const timer = setTimeout(fetchCustomer, 300);
      return () => {
        clearTimeout(timer);
        isActive = false;
      };
    } else {
      setCustomerResults([]);
      setShowCustomerSuggestions(false);
      setIsSearchingCustomer(false);
      if (customerPhone.length === 0) {
        setCustomerName("Customer");
        setSelectedCustomerID(1);
      }
    }
  }, [customerPhone]);

  // Check if cash register is open on mount
  useEffect(() => {
    const checkOpenStatus = async () => {
      if (!deviceId) {
        console.log("No device ID available, skipping register open check");
        return;
      }

      try {
        console.log("Checking if cash register is open for device:", deviceId);
        const response = await checkRegisterOpen(deviceId);
        console.log("Cash register open status response:", response);

        if (response.status === true && response.data) {
          if (response.data.isOpen === false) {
            console.log(
              "Cash register is closed, showing opening amount modal",
            );
            setShowOpeningAmountModal(true);
          } else {
            console.log("Cash register is already open");
            setShowOpeningAmountModal(false);
          }
        }
      } catch (error) {
        console.error("Failed to check register open status:", error);
        // Show modal on error to be safe
        setShowOpeningAmountModal(true);
      }
    };

    checkOpenStatus();
  }, [deviceId]);

  // Handle opening amount submission
  const handleOpeningAmountSubmit = async (amount) => {
    if (!deviceId) {
      console.error("No device ID available");
      return;
    }

    setIsOpeningAmountLoading(true);
    try {
      console.log("Setting opening amount:", amount, "for device:", deviceId);
      const response = await setOpeningAmount(deviceId, amount);
      console.log("Set opening amount response:", response);

      if (response.status === true) {
        console.log(
          "Opening amount set successfully, SessionID:",
          response.data?.SessionID,
        );
        setRegisterSessionId(response.data?.SessionID);
        setShowOpeningAmountModal(false);
        // Focus item code after modal closes
        setTimeout(() => itemCodeRef.current?.focus(), 100);
      } else {
        console.error(
          "Failed to set opening amount:",
          response.error_message || response.message,
        );
        setAlertConfig({
          isOpen: true,
          title: "Registration Error",
          message:
            "Failed to set opening amount: " +
            (response.error_message || response.message),
          type: "error",
        });
      }
    } catch (error) {
      console.error("Set opening amount failed:", error);
      setAlertConfig({
        isOpen: true,
        title: "Registration Error",
        message: "Error setting opening amount: " + error.message,
        type: "error",
      });
    } finally {
      setIsOpeningAmountLoading(false);
    }
  };

  // Item code search with keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      // Ignore Enter key if it's coming from an input field (quantity, discount, etc.)
      // Only handle Enter for the item code search suggestions
      const target = e.target;
      if (target && target.tagName === "INPUT" && target.type === "number") {
        // Let the input field handle its own Enter key
        return;
      }

      if (!suggestions || suggestions.length === 0) return;
      if (e.key === "ArrowDown") {
        setHighlightIndex((i) => Math.min(suggestions.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        setHighlightIndex((i) => Math.max(-1, i - 1));
      } else if (e.key === "Enter") {
        if (highlightIndex >= 0 && suggestions[highlightIndex]) {
          selectSuggestedItem(suggestions[highlightIndex]);
        } else if (itemCode.trim()) {
          // fallback: search by barcode
          searchBarcode(itemCode.trim());
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // only depends on suggestions/highlightIndex
  }, [suggestions, highlightIndex, itemCode]);

  // Auto-search when user types at least 3 characters (debounced)
  useEffect(() => {
    const doSearch = debounce((val) => {
      if (val && val.length >= 3) {
        searchBarcode(val);
      } else {
        setSuggestions([]);
      }
    }, 250);

    doSearch(itemCode);
    return () => doSearch.cancel();
  }, [itemCode]);

  const searchBarcode = async (code) => {
    try {
      const resp = await getItemByBarcode(code, LocationID);
      if (resp && resp.status === true && Array.isArray(resp.data)) {
        setSuggestions(resp.data);
        setHighlightIndex(0);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Barcode search failed:", err);
      setSuggestions([]);
      if (
        err.message?.includes("500") ||
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("network")
      ) {
        setAlertConfig({
          isOpen: true,
          title: "Connection Error",
          message:
            "Could not reach the server. Please check your internet or contact technical support.",
          type: "error",
        });
      }
    }
  };

  const selectSuggestedItem = async (item) => {
    // Check stock before adding
    try {
      // Get current quantity in cart
      const currentItems = useBillingStore.getState().selectedItems;
      const existingItem = currentItems.find(
        (i) => i.inventoryID === item.inventoryID,
      );
      const currentQty = existingItem ? existingItem.QTY : 0;
      const requestQty = currentQty + 1;
      // Verify with API
      // LocationID is retrieved from AuthStore
      const resp = await getItemQuantity(item.barcode, LocationID);

      if (
        resp &&
        resp.status === true &&
        Array.isArray(resp.data) &&
        resp.data.length > 0
      ) {
        // Response data is an array: [{ inventoryID, quantity }]
        const availableStock = Number(resp.data[0].quantity || 0);

        if (requestQty > availableStock) {
          setAlertConfig({
            isOpen: true,
            title: "Insufficient Stock",
            message: `Cannot add item.\nRequested: ${requestQty}\nAvailable: ${availableStock}`,
          });
          return;
        }
      } else if (
        resp &&
        resp.status === true &&
        Array.isArray(resp.data) &&
        resp.data.length === 0
      ) {
        // If data is empty array, it might mean 0 stock or item not found in stock table?
        const availableStock = 0;
        if (requestQty > availableStock) {
          setAlertConfig({
            isOpen: true,
            title: "Insufficient Stock",
            message: `Cannot add item.\nRequested: ${requestQty}\nAvailable: ${availableStock}`,
          });
          return;
        }
      } else {
        // Fallback or error handling
        console.warn("Could not verify stock level", resp);
        // User asked to "tell user that specific item cannot add", so blocking on failure might be safer
        // but if the API fails for other reasons we might block valid sales.
        // Let's assume strict check as requested.
        // But logic: if status is false, it might mean item not found or error.
      }
    } catch (err) {
      console.error("Stock check failed:", err);
      // alert("Error checking stock. Please try again.");
      // return;
    }

    // Map API response fields to billing store item shape
    addItem({
      inventoryID: item.inventoryID,
      itemName: item.itemName,
      itemUnitPrice: item.itemUnitPrice,
      itemCostPrice: item.itemCostPrice,
      barcode: item.barcode,
      itemDescription: item.itemDescription,
      itemCategory: item.itemCategory,
      locationID: item.locationID,
      QTY: 1,
      Discount: 0,
      amount: item.itemUnitPrice,
    });
    setItemCode("");
    setSuggestions([]);
    setHighlightIndex(-1);
    // After adding item, focus quantity of the newly added row
    setTimeout(() => {
      const last =
        useBillingStore.getState().selectedItems?.[
          useBillingStore.getState().selectedItems.length - 1
        ];
      if (last && rowRefs.current.has(last.inventoryID)) {
        rowRefs.current.get(last.inventoryID).qtyRef.current?.focus();
        rowRefs.current.get(last.inventoryID).qtyRef.current?.select?.();
      }
    }, 0);
  };

  // Save: create (if needed) -> add details -> complete; shows returned change in the sidebar
  const handleAddDetails = async () => {
    try {
      setIsProcessing(true);
      // Prepare a timestamp for last_bill.json writes
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate(),
      )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
        now.getSeconds(),
      )}`;
      // Lock inputs immediately when Save is pressed to prevent further edits
      setInputsLocked(true);
      // Move focus to the Print Invoice button so the user can press Enter to print
      setTimeout(() => printButtonRef.current?.focus(), 0);
      if (!selectedItems || selectedItems.length === 0) {
        setAlertConfig({
          isOpen: true,
          title: "Items Missing",
          message: "Add at least one item before saving the bill.",
          type: "info",
        });
        setIsProcessing(false);
        setInputsLocked(false);
        return;
      }
      // Ensure bill exists (create if missing)
      let billIdToUse = currentBillId;
      if (!billIdToUse) {
        const createResp = await createBill({
          LocationID: LocationID,
          CustomerID: selectedCustomerID || 1,
          CashierID: user?.id || 1,
          HelperID: selectedHelperID,
          RegisterID: deviceId,
        });
        if (!(createResp && createResp.status === true && createResp.data)) {
          setAlertConfig({
            isOpen: true,
            title: "Save Error",
            message: "Failed to create bill",
            type: "error",
          });
          return;
        }
        billIdToUse = createResp.data;
        setCurrentBillId(billIdToUse);
      }

      const itemsPayload = selectedItems.map((it) => {
        // Send the raw discount value (absolute rupees) as-entered by the user.
        // Do not convert to percentage on the client.
        return {
          InventoryID: it.inventoryID,
          Discount: Number(it.Discount) || 0,
          QTY: it.QTY || 1,
        };
      });

      const resp = await addBillDetails({
        BillID: billIdToUse,
        Items: itemsPayload,
      });
      console.log("Add details response:", resp);
      if (!(resp && resp.status === true)) {
        setAlertConfig({
          isOpen: true,
          title: "Save Error",
          message:
            "Failed to save details: " +
            (resp?.error_message || resp?.message || JSON.stringify(resp)),
          type: "error",
        });
        return;
      }

      // Removed interim last_bill.json write (WriteOnly) to reduce redundant IPC overhead.
      // The final save after completion will handle the state persistence.

      // Complete billing and show returned change (with retry logic)
      const payment = {
        CashAmount: parseFloat(cashPayAmount) || 0,
        CardAmount: parseFloat(cardAmount) || 0,
        ChequeAmount: parseFloat(chequeAmount) || 0,
      };

      const MAX_COMPLETE_ATTEMPTS = 3;
      let completeResp = null;
      let lastError = null;

      for (let attempt = 1; attempt <= MAX_COMPLETE_ATTEMPTS; attempt++) {
        try {
          console.log(
            `[CompleteBill] Attempt ${attempt} of ${MAX_COMPLETE_ATTEMPTS}`,
          );
          completeResp = await completeBill(billIdToUse, payment);

          if (completeResp && completeResp.status === true) {
            setCreditBalance(completeResp.data || 0);
            lastError = null;
            break; // Success, exit retry loop
          } else {
            // API returned but with error status
            lastError =
              completeResp?.error_message ||
              completeResp?.message ||
              JSON.stringify(completeResp);
            console.warn(
              `[CompleteBill] Attempt ${attempt} failed:`,
              lastError,
            );
          }
        } catch (err) {
          lastError = err.message || "Unknown error";
          console.error(`[CompleteBill] Attempt ${attempt} threw error:`, err);
        }

        // If not the last attempt, wait briefly before retrying
        if (attempt < MAX_COMPLETE_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // If all attempts failed, log out the user
      if (lastError) {
        setAlertConfig({
          isOpen: true,
          title: "Completion Failed",
          message: `Failed to complete billing after ${MAX_COMPLETE_ATTEMPTS} attempts. You will be logged out.\n\nError: ${lastError}`,
          type: "error",
        });
        // Clear session to force logout
        useAuthStore.getState().clearSession();
        return;
      }
      // After a successful Save (complete billing), we DO NOT clear the UI.
      // The user wants to see the details. Clearing happens on Print or Clear button.
      if (completeResp && completeResp.status === true) {
        // Keep creditBalance as returned by the server so operator sees the change
        const balance = completeResp.data || 0;
        setCreditBalance(balance);
        setLastBillBalance(balance); // Store in persistent state

        // Update last_bill.json again with the returned balance
        try {
          if (window?.electron?.ipcRenderer) {
            const finalPayload = {
              BillID: String(billIdToUse),
              date: dateStr,
              CashierName: cashierName,
              CustomerName: (customerName || "").trim() || "Unknown",
              CustomerFName: (customerName || "").trim().split(/\s+/)[0] || "",
              CustomerLName:
                (customerName || "").trim().split(/\s+/).slice(1).join(" ") ||
                "",
              Subtotal: Number(subtotal || 0),
              Total: Number(total || 0),
              Discount: Number(totalDiscount || 0),
              CashAmount: parseFloat(cashPayAmount) || 0,
              CardAmount: parseFloat(cardAmount) || 0,
              ChequeAmount: parseFloat(chequeAmount) || 0,
              Balance: Number(completeResp.data || 0),
              Details: selectedItems.map((it) => ({
                ItemName:
                  it.itemDescription ||
                  it.Description ||
                  it.itemName ||
                  `Item ${it.inventoryID}`,
                QTY: Number(it.QTY || 1),
                UnitPrice: Number(
                  it.itemUnitPrice || it.UnitPrice || it.price || 0,
                ),
              })),
              WriteOnly: true,
            };
            const now3 = new Date();
            const time3 = `${now3.getHours().toString().padStart(2, '0')}:${now3.getMinutes().toString().padStart(2, '0')}:${now3.getSeconds().toString().padStart(2, '0')}.${now3.getMilliseconds().toString().padStart(3, '0')}`;
            console.log(
              `[${time3}] Updating final last_bill.json with balance:`,
              finalPayload.Balance,
            );
            try {
              await window.electron.ipcRenderer.invoke(
                "print-receipt",
                finalPayload,
              );
            } catch (ipcErr2) {
              console.warn("Failed to write final last_bill.json:", ipcErr2);
            }
          }
        } catch (ufErr) {
          console.warn("Final last_bill write failed:", ufErr);
        }

        // On success, clear the entire transaction and UI fields for the next customer
        // but keep the balance and last bill balance visible.
        resetTransaction();
        setCurrentBillId(null);
        setItemCode("");
        setCustomerName("Customer");
        setCustomerPhone("");
        setCashPayAmount("0.00");
        setCardAmount("0.00");
        setChequeAmount("0.00");
        setUserEditedCash(false);
        setUserEditedCard(false);
        setUserEditedCheque(false);
        setSelectedHelperID(null);
        setHelperSearchTerm("");

        // Focus Print Invoice button so user can press Enter to print
        // (focus was already set at start of save, but ensure it stays there)
        setTimeout(() => printButtonRef.current?.focus(), 100);
      }
    } catch (err) {
      console.error("Add details failed:", err);
      setAlertConfig({
        isOpen: true,
        title: "Save Failed",
        message: "Error saving bill details: " + err.message,
        type: "error",
      });
    } finally {
      // Always unlock inputs and stop processing spinner, regardless of success or error
      setInputsLocked(false);
      setIsProcessing(false);
    }
  };

  // Save current items as a temporary bill (create bill + add details, but do not complete)
  const handleSaveTemporary = async () => {
    try {
      setIsProcessing(true);
      if (!selectedItems || selectedItems.length === 0) {
        setAlertConfig({
          isOpen: true,
          title: "Items Missing",
          message: "Add at least one item before saving the temporary bill.",
          type: "info",
        });
        return;
      }

      // Create a bill first
      const createResp = await createBill({
        LocationID: LocationID,
        CustomerID: selectedCustomerID || 1,
        CashierID: user?.id || 1,
        HelperID: selectedHelperID,
        RegisterID: deviceId,
      });
      if (!(createResp && createResp.status === true && createResp.data)) {
        setAlertConfig({
          isOpen: true,
          title: "Temporary Save Error",
          message: "Failed to create temporary bill",
          type: "error",
        });
        return;
      }
      const billId = createResp.data;
      // Prepare items payload - send raw Discount (absolute rupees)
      const itemsPayload = selectedItems.map((it) => ({
        InventoryID: it.inventoryID,
        Discount: Number(it.Discount) || 0,
        QTY: it.QTY || 1,
      }));

      const detailsResp = await addBillDetails({
        BillID: billId,
        Items: itemsPayload,
      });
      if (!(detailsResp && detailsResp.status === true)) {
        setAlertConfig({
          isOpen: true,
          title: "Temporary Save Error",
          message:
            "Failed to save temporary bill details: " +
            (detailsResp?.error_message ||
              detailsResp?.message ||
              JSON.stringify(detailsResp)),
          type: "error",
        });
        return;
      }

      // Keep the bill id so user can resume later
      setCurrentBillId(billId);
      // Optionally refresh temporary bills list if modal exists
      try {
        await loadTemporaryBills();
      } catch (e) {
        /* ignore */
      }

      setAlertConfig({
        isOpen: true,
        title: "Bill Saved",
        message: "Temporary bill saved (ID: " + billId + ")",
        type: "success",
      });
    } catch (err) {
      console.error("Save temporary failed:", err);
      setAlertConfig({
        isOpen: true,
        title: "Temporary Save Failed",
        message: "Error saving temporary bill: " + (err?.message || err),
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintInvoice = async () => {
    try {
      // Mark printing in progress (used to disable the button and show overlay)
      setIsPrinting(true);
      // Unlock inputs as soon as Print is pressed (they were locked after Save)
      setInputsLocked(false);

      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
      console.log(`[${time}] handlePrintInvoice: clicked`, {
        selectedItemsLength: selectedItems.length,
        isPrinting,
      });

      // If ipcRenderer is not available, reset printing flag and notify the user
      if (!window?.electron?.ipcRenderer) {
        console.warn(
          "handlePrintInvoice: ipcRenderer not available in renderer",
        );
        setIsPrinting(false);
        setAlertConfig({
          isOpen: true,
          title: "Print Error",
          message: "Printing is not available in this environment.",
          type: "error",
        });
        return;
      }

      // Build the exact JSON structure the printing subsystem expects
      const billId =
        currentBillId ||
        `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const dateStr = new Date().toISOString().replace("T", " ").slice(0, 19);
      const cashierId =
        window?.electron?.user?.id || useBillingStore.getState().cashier || "1";

      // Derive customer name fields from the Customer input box
      const fullCustomerName = (customerName || "").trim();

      const payload = {
        BillID: billId,
        date: dateStr,
        CashierName: cashierName,
        // Send customer name instead of an ID for printing as requested
        CustomerName: fullCustomerName,
        Subtotal: Number(subtotal || 0),
        Total: Number(total || 0),
        Discount: Number(totalDiscount || 0),
        // Include payment amounts so the main process can write them to last_bill.json
        CashAmount: parseFloat(cashPayAmount) || 0,
        CardAmount: parseFloat(cardAmount) || 0,
        ChequeAmount: parseFloat(chequeAmount) || 0,
        Balance: Number(creditBalance || 0),
        Details: selectedItems.map((it) => ({
          ItemName: it.itemName || it.ItemName || it.name || "Item",
          QTY: Number(it.QTY || 1),
          UnitPrice: Number(it.itemUnitPrice || it.UnitPrice || it.price || 0),
        })),
      };

      const now2 = new Date();
      const time2 = `${now2.getHours().toString().padStart(2, '0')}:${now2.getMinutes().toString().padStart(2, '0')}:${now2.getSeconds().toString().padStart(2, '0')}.${now2.getMilliseconds().toString().padStart(3, '0')}`;
      console.log(`[${time2}] handlePrintInvoice: payload prepared`, payload);
      const result = await window.electron.ipcRenderer.invoke(
        "print-receipt",
        payload,
      );
      const now5 = new Date();
      const time5 = `${now5.getHours().toString().padStart(2, '0')}:${now5.getMinutes().toString().padStart(2, '0')}:${now5.getSeconds().toString().padStart(2, '0')}.${now5.getMilliseconds().toString().padStart(3, '0')}`;
      console.log(`[${time5}] Print result:`, result);

      if (!result || result.success !== true) {
        console.warn(
          "Printing failed or returned unsuccessful result:",
          result,
        );
        if (result) {
          console.warn("error:", result.error);
          console.warn("stdout:", result.stdout || result.message || "");
          console.warn("stderr:", result.stderr || "");
          console.warn("returned bill:", result.bill || "no bill");
        }
        // Unlock inputs so the operator can correct and retry
        setInputsLocked(false);
        return;
      }

      // On success, clear the entire transaction and UI fields so operator can start a new one
      if (useBillingStore.getState().resetTransaction) {
        useBillingStore.getState().resetTransaction();
      } else {
        useBillingStore.getState().clearItems();
        setCurrentBillId(null);
      }
      setItemCode("");
      setCustomerPhone("");
      setCashPayAmount("0.00");
      setCardAmount("0.00");
      setChequeAmount("0.00");
      setCreditBalance(0);
      setCurrentBillId(null);
      setSelectedHelperID(null);
      setHelperSearchTerm("");
      // Unlock inputs after successful print so user can continue
      setInputsLocked(false);
      // Focus item code for next transaction
      setTimeout(() => {
        itemCodeRef.current?.focus();
        itemCodeRef.current?.select?.();
      }, 0);
    } catch (err) {
      console.warn("Print invoke failed:", err);
      // On unexpected error, unlock inputs so operator can continue
      setInputsLocked(false);
    } finally {
      setIsPrinting(false);
    }
  };

  const fetchTemporaryBillDetails = async (billId) => {
    try {
      const resp = await getBill(billId);
      if (resp && resp.status === true && resp.data) {
        // Preserve or set current bill id (don't wipe if already same)
        if (!currentBillId || currentBillId !== resp.data.BillID) {
          setCurrentBillId(resp.data.BillID);
        }

        // Update / merge into temporary bills array
        setTemporaryBills((prev) => {
          const exists = prev.some((b) => b.BillID === resp.data.BillID);
          if (!exists) return [resp.data, ...prev];
          return prev.map((b) =>
            b.BillID === resp.data.BillID ? { ...b, ...resp.data } : b,
          );
        });

        // Clear only items then repopulate from bill Details directly (no extra inventory fetch)
        useBillingStore.getState().clearItems();

        if (Array.isArray(resp.data.Details)) {
          // Clear current items before adding loaded bill's items
          useBillingStore.getState().clearItems();
          resp.data.Details.forEach((d) => {
            const qty = d.QTY || 1;
            const unitPrice = d.UnitPrice || d.itemUnitPrice || 0;
            const lineTotal = (unitPrice || 0) * qty;
            // Treat backend Discount as an absolute rupee amount and do not
            // convert it to a percentage. Clamp to line total and round to 2dp.
            const raw = parseFloat(d.Discount || 0) || 0;
            const absDiscount = parseFloat(Math.min(raw, lineTotal).toFixed(2));
            addItem({
              inventoryID: d.InventoryID,
              itemName: d.ItemName || `Item ${d.InventoryID}`,
              itemUnitPrice: unitPrice,
              itemCostPrice: d.CostPrice || 0,
              barcode: d.Barcode || d.barcode || "",
              itemDescription:
                d.Description || d.ItemDescription || d.itemDescription || "",
              itemCategory: d.Category || null,
              locationID: resp.data.LocationID,
              QTY: qty,
              Discount: absDiscount, // store internally as absolute amount
            });
          });
        }
      }
    } catch (err) {
      console.error("Fetch bill failed:", err);
    }
  };

  const loadTemporaryBills = async () => {
    setLoadingTempBills(true);
    setTempBillsError("");
    try {
      const resp = await getTemporaryBills(LocationID);
      if (resp && resp.status === true && Array.isArray(resp.data)) {
        // Replace local list with server truth; sort newest first by createdDateTime then BillID desc
        const getTs = (x) => {
          const d =
            x.createdDateTime ||
            x.CreatedDateTime ||
            x.createdAt ||
            x.CreatedAt ||
            x.created_date ||
            x.CreatedDate ||
            x.dateCreated ||
            x.DateCreated ||
            null;
          const t = d ? new Date(d).getTime() : 0;
          return Number.isFinite(t) ? t : 0;
        };
        const sorted = [...resp.data].sort((a, b) => {
          const ta = getTs(a);
          const tb = getTs(b);
          if (tb !== ta) return tb - ta; // newest first
          return (b.BillID || 0) - (a.BillID || 0);
        });
        setTemporaryBills(sorted);
      } else if (resp && resp.status === false) {
        // API returned an error message (for example: No pending bills found.)
        setTemporaryBills([]);
        setTempBillsError(
          resp.error_message || resp.message || "No temporary bills found",
        );
      } else {
        setTemporaryBills([]);
        setTempBillsError("Unexpected response loading temporary bills");
      }
    } catch (e) {
      console.error("Failed to load temporary bills", e);
      setTempBillsError(e.message || "Failed to load");
    } finally {
      setLoadingTempBills(false);
    }
  };

  // When opening the Temporary Bills modal, load the list
  useEffect(() => {
    if (showTemporaryBills) {
      loadTemporaryBills();
    }
  }, [showTemporaryBills]);

  const handleDeleteTemporaryBill = async (billId) => {
    try {
      const resp = await cancelBill(billId);
      console.log("Cancel bill response:", resp);
      if (resp && resp.status === true) {
        // If the deleted bill is currently loaded, clear transaction
        if (currentBillId === billId) {
          resetTransaction();
          setCurrentBillId(null);
        }
        // Refresh list from backend (no optimistic removal needed)
        await loadTemporaryBills();
      } else {
        console.warn("Failed to delete temporary bill", resp);
        setTempBillsError(
          resp?.error_message || resp?.message || "Delete failed",
        );
      }
    } catch (err) {
      console.error("Delete temporary bill failed:", err);
      setTempBillsError(err.message || "Delete error");
    }
  };

  // Clear UI and transaction state (keep defaults)
  const handleClear = () => {
    // Reset store transaction (items, customer, currentBillId)
    resetTransaction();
    // Reset local payment inputs and balances
    setCashPayAmount("0.00");
    setCardAmount("0.00");
    setChequeAmount("0.00");
    setCreditBalance(0);
    // Reset local customer inputs as well
    setCustomerName("Customer");
    setCustomerPhone("");
    setCustomerResults([]);
    setShowCustomerSuggestions(false);
    setSelectedCustomerID(1);
    setSelectedHelperID(null);
    setHelperSearchTerm("");
    // Focus item code for convenience
    setTimeout(() => itemCodeRef.current?.focus(), 0);
  };

  // Listen for global clear events (fired by SummaryBox Clear button) to ensure
  // both store and local UI fields are cleared across the app lifetime.
  useEffect(() => {
    const onGlobalClear = () => handleClear();
    window.addEventListener("puwasa:clear", onGlobalClear);
    return () => window.removeEventListener("puwasa:clear", onGlobalClear);
  }, []);

  // Listen for main-process notifications when last_bill.json is updated.
  // The handler updates the balance in the UI only when the writeStage is 'final'.
  useEffect(() => {
    const ipc = window?.electron?.ipcRenderer;
    if (!ipc || !ipc.on) return;

    const handler = (ev, data) => {
      try {
        const now4 = new Date();
        const time4 = `${now4.getHours().toString().padStart(2, '0')}:${now4.getMinutes().toString().padStart(2, '0')}:${now4.getSeconds().toString().padStart(2, '0')}.${now4.getMilliseconds().toString().padStart(3, '0')}`;
        console.log(`[${time4}] Renderer received last-bill-updated:`, data);
        if (!data) return;
        if (data.writeStage === "final" && data.Balance != null) {
          setCreditBalance(Number(data.Balance));
        }
      } catch (err) {
        console.warn("last-bill-updated handler error:", err);
      }
    };

    ipc.on("last-bill-updated", handler);
    return () => {
      try {
        ipc.removeListener("last-bill-updated", handler);
      } catch (e) {
        /* ignore */
      }
    };
  }, []);

  // Removed auto-filling payment inputs from total; user enters amounts explicitly.

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Items area */}
      <div className="flex flex-col flex-grow p-4 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="flex-1"></div>
          <button
            onClick={() => setShowCashInOut(true)}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 transition ${
              isProcessing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Cash IN/Out
          </button>
          <button
            onClick={() => setShowCashCount(true)}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 transition ${
              isProcessing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Cash Count
          </button>
          <button
            onClick={() => setShowTemporaryBills(true)}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-lg border border-sky-200 text-sky-700 bg-white hover:bg-sky-50 transition ${
              isProcessing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Temporary
          </button>
          <button
            onClick={() => setShowSearchByNameModal(true)}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition ${
              isProcessing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Search by name
          </button>
          <div className="flex-1"></div>
        </div>

        {/* Customer row */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm">Customer</label>
            <input
              className="border px-2 py-1 w-40"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              readOnly={inputsLocked}
            />
            <label className="text-sm">Phone</label>
            <div className="relative" ref={customerSearchRef}>
              <input
                className="border px-2 py-1 w-44 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={customerPhone}
                readOnly={inputsLocked}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomerPhone(formatPhoneNumber(val));
                  const raw = val.replace(/\D/g, "");
                  if (raw.length >= 5) {
                    setShowCustomerSuggestions(true);
                    setCustomerHighlightIndex(0);
                  } else {
                    setShowCustomerSuggestions(false);
                    setCustomerHighlightIndex(-1);
                  }
                }}
                onFocus={() => {
                  const raw = customerPhone.replace(/\D/g, "");
                  if (raw.length >= 5) {
                    setShowCustomerSuggestions(true);
                    setCustomerHighlightIndex(-1);
                  }
                }}
                onKeyDown={(e) => {
                  if (!showCustomerSuggestions || customerResults.length === 0)
                    return;

                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setCustomerHighlightIndex((prev) =>
                      prev < customerResults.length - 1 ? prev + 1 : prev,
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setCustomerHighlightIndex((prev) =>
                      prev > 0 ? prev - 1 : 0,
                    );
                  } else if (e.key === "Enter") {
                    if (
                      customerHighlightIndex >= 0 &&
                      customerHighlightIndex < customerResults.length
                    ) {
                      e.preventDefault();
                      const c = customerResults[customerHighlightIndex];
                      setCustomerPhone(formatPhoneNumber(c.phone));
                      setCustomerName(c.firstname || "Customer");
                      setSelectedCustomerID(c.customerid);
                      setShowCustomerSuggestions(false);
                      setCustomerHighlightIndex(-1);
                    }
                  } else if (e.key === "Escape") {
                    setShowCustomerSuggestions(false);
                    setCustomerHighlightIndex(-1);
                  }
                }}
              />
              {showCustomerSuggestions && (
                <div className="absolute left-0 right-0 bg-white border mt-1 z-50 max-h-48 overflow-y-auto shadow-lg rounded-md min-w-[200px]">
                  {console.log(
                    "[CustomerSearch] Rendering UI. show:",
                    showCustomerSuggestions,
                    "loading:",
                    isSearchingCustomer,
                    "results:",
                    customerResults,
                  )}
                  {isSearchingCustomer ? (
                    <div className="p-2 text-gray-500 text-sm flex items-center gap-2">
                      <span className="inline-block h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      Searching...
                    </div>
                  ) : customerResults.length > 0 ? (
                    customerResults.map((c, idx) => (
                      <div
                        key={c.customerid || idx}
                        className={`p-2 cursor-pointer hover:bg-emerald-50 text-sm border-b last:border-b-0 ${
                          idx === customerHighlightIndex ? "bg-emerald-100" : ""
                        }`}
                        onClick={() => {
                          console.log("[CustomerSearch] Selected:", c);
                          setCustomerPhone(formatPhoneNumber(c.phone));
                          setCustomerName(c.firstname || "Customer");
                          setSelectedCustomerID(c.customerid);
                          setShowCustomerSuggestions(false);
                          setCustomerHighlightIndex(-1);
                        }}
                      >
                        <div className="font-semibold">
                          {c.firstname} {c.lastname}
                        </div>
                        <div className="text-xs text-gray-500">{c.phone}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-gray-500 text-sm">
                      No customer found
                    </div>
                  )}
                </div>
              )}
            </div>
            <label className="text-sm ml-2">Cashier</label>
            <div className="border px-2 py-1 min-w-[100px] bg-gray-50 text-sm">
              {cashierName}
            </div>
            <label className="text-sm ml-2">Helper</label>
            <div className="relative" ref={helperSearchRef}>
              <input
                className="border px-2 py-1 text-sm rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 w-40"
                placeholder="Search Helper"
                value={helperSearchTerm}
                onFocus={() => {
                  if (helperSearchTerm.trim() !== "") {
                    setShowHelperSuggestions(true);
                    setHelperHighlightIndex(-1);
                  }
                }}
                onChange={(e) => {
                  setHelperSearchTerm(e.target.value);
                  setShowHelperSuggestions(true);
                  setHelperHighlightIndex(0);
                  // If user clears the search, also clear the selected ID
                  if (!e.target.value) setSelectedHelperID(null);
                }}
                onKeyDown={(e) => {
                  if (!showHelperSuggestions || filteredHelpers.length === 0)
                    return;

                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHelperHighlightIndex((prev) =>
                      prev < filteredHelpers.length - 1 ? prev + 1 : prev,
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHelperHighlightIndex((prev) =>
                      prev > 0 ? prev - 1 : 0,
                    );
                  } else if (e.key === "Enter") {
                    if (
                      helperHighlightIndex >= 0 &&
                      helperHighlightIndex < filteredHelpers.length
                    ) {
                      e.preventDefault();
                      const h = filteredHelpers[helperHighlightIndex];
                      setSelectedHelperID(h.UserID);
                      setHelperSearchTerm(`${h.firstname} ${h.lastname}`);
                      setShowHelperSuggestions(false);
                      setHelperHighlightIndex(-1);
                    }
                  } else if (e.key === "Escape") {
                    setShowHelperSuggestions(false);
                    setHelperHighlightIndex(-1);
                  }
                }}
              />
              {showHelperSuggestions && helperSearchTerm.trim() !== "" && (
                <div className="absolute left-0 right-0 bg-white border mt-1 z-50 max-h-48 overflow-y-auto shadow-lg rounded-md">
                  {filteredHelpers.length > 0 ? (
                    filteredHelpers.map((h, idx) => (
                      <div
                        key={h.UserID}
                        className={`p-2 cursor-pointer hover:bg-emerald-50 text-sm border-b last:border-b-0 ${
                          idx === helperHighlightIndex ? "bg-emerald-100" : ""
                        }`}
                        onClick={() => {
                          setSelectedHelperID(h.UserID);
                          setHelperSearchTerm(`${h.firstname} ${h.lastname}`);
                          setShowHelperSuggestions(false);
                          setHelperHighlightIndex(-1);
                        }}
                      >
                        {h.firstname} {h.lastname}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-gray-500 text-sm">
                      No staff found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1"></div>
        </div>

        {/* Items table */}
        <div className="overflow-y-auto bg-white rounded-xl shadow mt-4 px-2 py-2 flex-grow">
          <div className="relative">
            {/* Header row */}
            <div
              className="grid text-sm font-semibold border-b py-2 sticky top-0 bg-white z-10"
              style={{
                gridTemplateColumns: "240px 1fr 120px 70px 120px 100px",
                columnGap: "12px",
              }}
            >
              <div className="flex flex-col">
                <div className="text-gray-600">Item Code</div>
                <div className="relative w-full">
                  <input
                    className="border mt-1 px-2 py-2 w-full text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-8"
                    placeholder="Scan / Type barcode"
                    value={itemCode}
                    ref={itemCodeRef}
                    readOnly={inputsLocked}
                    onChange={(e) => {
                      const val = e.target.value;
                      // If user types '+' we end item entry and focus cash
                      if (val.trim() === "+") {
                        setItemCode("");
                        setSuggestions([]);
                        setHighlightIndex(-1);
                        setTimeout(() => cashInputRef.current?.focus(), 0);
                        return;
                      }
                      setItemCode(val.toUpperCase());
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        itemCode.trim() &&
                        suggestions.length === 0
                      ) {
                        // Enter on item code triggers barcode lookup fallback
                        searchBarcode(itemCode.trim());
                      }
                    }}
                  />
                  {itemCode && (
                    <button
                      tabIndex={-1}
                      onClick={() => {
                        setItemCode("");
                        setSuggestions([]);
                        setHighlightIndex(-1);
                        itemCodeRef.current?.focus();
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 p-1"
                      title="Clear"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="text-gray-600">Description</div>
              <div className="text-gray-600">Unit Price</div>
              <div className="text-gray-600">QTY</div>
              <div className="text-gray-600">Amount</div>
              <div className="text-gray-600">Discount</div>
            </div>

            {/* Overlap suggestions panel positioned over table (doesn't change table layout) */}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 bg-white border mt-1 z-40 max-h-48 overflow-y-auto shadow">
                {suggestions.map((s, idx) => (
                  <div
                    key={s.inventoryID}
                    onClick={() => selectSuggestedItem(s)}
                    className={`p-2 cursor-pointer uppercase ${
                      idx === highlightIndex ? "bg-blue-100" : ""
                    }`}
                  >
                    <div className="font-semibold">{s.itemName}</div>
                    <div className="text-xs text-gray-600">
                      Barcode: {s.barcode} | Rs: {s.itemUnitPrice}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items selected
            </div>
          ) : (
            selectedItems.map((item, i) => (
              <BillingItemRow
                key={item.inventoryID || `it-${i}`}
                item={item}
                onDoubleClick={() => removeItem(item.inventoryID)}
                registerRowRef={registerRowRef}
                onFocusItemCode={() => {
                  itemCodeRef.current?.focus();
                  itemCodeRef.current?.select?.();
                }}
              />
            ))
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="w-1/3">
            {/* Placeholder left area in original design */}
          </div>
          <div className="text-center">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Item Count
            </div>
            <div className="text-5xl font-extrabold text-emerald-600 drop-shadow-sm">
              {itemCount}
            </div>
          </div>
          <div className="w-1/3 text-right">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Total Amount
            </div>
            <div className="text-3xl font-extrabold text-gray-900">
              Rs: {subtotal.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">
              Discount:{" "}
              <span className="font-medium text-gray-700">
                Rs: {totalDiscount.toFixed(2)}
              </span>
            </div>
            <div className="mt-1 text-2xl font-extrabold text-emerald-700">
              Net: Rs: {Math.max(0, subtotal - totalDiscount).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Payment and actions */}
      <div className="w-[340px] bg-white p-4 border-l flex flex-col">
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-700">
            Cash Pay Amount
          </div>
          <input
            className="w-full border px-4 py-3 text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={cashPayAmount}
            onChange={(e) => {
              setUserEditedCash(true);
              if (!inputsLocked) setCashPayAmount(e.target.value);
            }}
            onFocus={(e) => e.target.select()}
            onBlur={(e) => {
              // Normalize format
              if (e.target.value && !isNaN(parseFloat(e.target.value))) {
                setCashPayAmount(parseFloat(e.target.value).toFixed(2));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // Move focus to card amount input
                e.preventDefault();
                cardInputRef.current?.focus();
                cardInputRef.current?.select?.();
              }
            }}
            placeholder="0.00"
            ref={cashInputRef}
            readOnly={inputsLocked}
          />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-700">
            Credit Card Amount
          </div>
          <input
            className="w-full border px-4 py-3 text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={cardAmount}
            onChange={(e) => {
              setUserEditedCard(true);
              if (!inputsLocked) setCardAmount(e.target.value);
            }}
            onFocus={(e) => e.target.select()}
            onBlur={(e) => {
              if (e.target.value && !isNaN(parseFloat(e.target.value))) {
                setCardAmount(parseFloat(e.target.value).toFixed(2));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // Move focus to Cheque amount input
                e.preventDefault();
                chequeInputRef.current?.focus();
                chequeInputRef.current?.select?.();
              }
            }}
            placeholder="0.00"
            ref={cardInputRef}
            readOnly={inputsLocked}
          />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-700">
            Cheque Amount
          </div>
          <input
            className="w-full border px-4 py-3 text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={chequeAmount}
            onChange={(e) => {
              setUserEditedCheque(true);
              if (!inputsLocked) setChequeAmount(e.target.value);
            }}
            onFocus={(e) => e.target.select()}
            onBlur={(e) => {
              if (e.target.value && !isNaN(parseFloat(e.target.value))) {
                setChequeAmount(parseFloat(e.target.value).toFixed(2));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // Move focus to Save button (do not click)
                e.preventDefault();
                saveButtonRef.current?.focus();
              }
            }}
            placeholder="0.00"
            ref={chequeInputRef}
            readOnly={inputsLocked}
          />
        </div>

        <div className="space-y-8 md:space-y-10">
          <div className="space-y-5">
            <div className="text-sm font-semibold text-gray-700">
              Change / Balance Amount
            </div>
            <div className="w-full border px-4 py-3 text-base rounded-lg bg-gray-50 text-gray-900">
              {`Rs: ${Math.abs(Number(creditBalance) || 0).toFixed(2)}`}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-semibold text-gray-700">
              Last Bill Balance
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {Math.abs(Number(lastBillBalance)).toFixed(2)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Role
            </div>
            <div className="text-xl uppercase tracking-wide font-bold text-emerald-700">
              {loginRole}
            </div>
          </div>
        </div>

        <div className="flex-1"></div>

        <div className="space-y-2 mt-auto">
          {/* Temporary button moved to the top action row */}
          <button
            onClick={handleSaveTemporary}
            disabled={selectedItems.length === 0 || isProcessing}
            className={`w-full px-3 py-2 mb-2 rounded-lg flex items-center justify-center gap-2 transition ${
              selectedItems.length === 0 || isProcessing
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-sky-700 border border-sky-200 hover:bg-sky-50"
            }`}
          >
            <span>Save Temporary</span>
          </button>

          <button
            ref={saveButtonRef}
            tabIndex={0}
            onClick={handleAddDetails}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddDetails();
                setTimeout(() => printButtonRef.current?.focus(), 0);
              }
            }}
            disabled={selectedItems.length === 0 || isProcessing}
            className={`w-full px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition ${
              selectedItems.length === 0 || isProcessing
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {isProcessing && (
              <span className="inline-block h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            )}
            <span>Save</span>
          </button>
          <button
            ref={printButtonRef}
            onClick={() => handlePrintInvoice()}
            disabled={isPrinting || isProcessing}
            className={`w-full px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg flex items-center justify-center gap-2 transition ${
              isPrinting || isProcessing ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {isPrinting && (
              <span className="inline-block h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            )}
            <span>Print Invoice</span>
          </button>
          <button
            onClick={() => handleClear()}
            className="w-full px-3 py-2 bg-white hover:bg-red-50 border border-red-300 rounded-lg text-red-600 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Modals */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={handleCloseAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
      <CashInOutModal
        isOpen={showCashInOut}
        onClose={() => setShowCashInOut(false)}
        type="in"
      />
      <CashCountModal
        isOpen={showCashCount}
        onClose={() => setShowCashCount(false)}
      />
      <TemporaryBillsModal
        isOpen={showTemporaryBills}
        onClose={() => setShowTemporaryBills(false)}
        temporaryBills={temporaryBills}
        loading={loadingTempBills}
        error={tempBillsError}
        onRefresh={loadTemporaryBills}
        onSelectBill={(b, idx) => {
          // fetch details and load; highlight already handled by modal
          fetchTemporaryBillDetails(b.BillID).then(() => {
            // Close modal and focus item code input for next entry
            setShowTemporaryBills(false);
            setTimeout(() => {
              itemCodeRef.current?.focus();
              itemCodeRef.current?.select?.();
            }, 0);
          });
        }}
        onDeleteBill={async (id, idx) => {
          await handleDeleteTemporaryBill(id);
        }}
      />
      <SearchByNameModal
        isOpen={showSearchByNameModal}
        onClose={() => {
          setShowSearchByNameModal(false);
          // Wait for modal transition/state update, then focus item code
          setTimeout(() => {
            itemCodeRef.current?.focus();
            itemCodeRef.current?.select?.();
          }, 50);
        }}
        onSelectItem={selectSuggestedItem}
      />
      <OpeningAmountModal
        isOpen={showOpeningAmountModal}
        onSubmit={handleOpeningAmountSubmit}
        isLoading={isOpeningAmountLoading}
      />

      {/* Hidden printable receipt */}
      <div style={{ display: "none" }}>
        <div ref={receiptRef}>
          <Receipt items={selectedItems} />
        </div>
      </div>
      {(isProcessing || isPrinting) && (
        // Make overlay visually blocking but allow pointer events to pass through
        // so that important inputs like Customer name/phone remain clickable.
        // The spinner panel itself should still receive pointer events.
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white px-4 py-3 rounded shadow flex items-center gap-3 pointer-events-auto">
            <span className="inline-block h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-700">
              {isProcessing ? "Processing..." : "Working..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
