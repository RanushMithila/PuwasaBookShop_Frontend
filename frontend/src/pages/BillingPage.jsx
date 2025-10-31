import { useEffect, useRef, useState } from "react";
import debounce from "lodash.debounce";
import BillingItemRow from "../components/BillingItemRow";
import SummaryBox from "../components/SummaryBox";
import useBillingStore from "../store/BillingStore";
import Receipt from "../components/Receipt";
import CashInOutModal from "../components/CashInOutModal";
import CashCountModal from "../components/CashCountModal";
import TemporaryBillsModal from "../components/TemporaryBillsModal";
import SearchByNameModal from "../components/SearchByNameModal"; // Import the new modal
import useTokenStore from "../store/TokenStore";
import {
  createBill,
  addBillDetails,
  completeBill,
  getItemByBarcode,
  getItemQuantity,
  getBill,
  cancelBill,
  getTemporaryBills,
} from "../services/BillingService";
import { getInventory } from "../services/InventoryService";

const BillingPage = () => {
  // Billing store
  const selectedItems = useBillingStore((s) => s.selectedItems);
  const addItem = useBillingStore((s) => s.addItem);
  const removeItem = useBillingStore((s) => s.removeItem);
  const setCurrentBillId = useBillingStore((s) => s.setCurrentBillId);
  const resetTransaction = useBillingStore((s) => s.resetTransaction);
  const currentBillId = useBillingStore((s) => s.currentBillId);

  // Token store
  const accessToken = useTokenStore((s) => s.accessToken);

  // UI state
  const [showCashInOut, setShowCashInOut] = useState(false);
  const [showCashCount, setShowCashCount] = useState(false);
  const [showTemporaryBills, setShowTemporaryBills] = useState(false);
  const [showSearchByNameModal, setShowSearchByNameModal] = useState(false); // State for the new modal
  const [temporaryBills, setTemporaryBills] = useState([]);
  const [loadingTempBills, setLoadingTempBills] = useState(false);
  const [tempBillsError, setTempBillsError] = useState("");

  // Customer
  const [customerName, setCustomerName] = useState("Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const locationName = "Polonnaruwa";

  // Search / item code and suggestions
  const [itemCode, setItemCode] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // Payment
  const [cashPayAmount, setCashPayAmount] = useState("0.00");
  const [cardAmount, setCardAmount] = useState("0.00");
  const [creditBalance, setCreditBalance] = useState(0);
  const [userEditedCash, setUserEditedCash] = useState(false);
  const [userEditedCard, setUserEditedCard] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // API actions (save/complete)
  const [isPrinting, setIsPrinting] = useState(false); // External print/python action

  const receiptRef = useRef();
  const itemCodeRef = useRef();
  const cashInputRef = useRef();
  const cardInputRef = useRef();
  const saveButtonRef = useRef();
  const printButtonRef = useRef();
  const rowRefs = useRef(new Map());
  const [inputsLocked, setInputsLocked] = useState(false);

  // Computed totals from store
  const subtotal = useBillingStore((s) => s.getSubtotal());
  const totalDiscount = useBillingStore((s) => s.getTotalDiscount());
  const total = useBillingStore((s) => s.getTotal());
  const itemCount = useBillingStore((s) => s.getTotalItems());

  // --- JWT decode helpers ---
  const decodeJWT = (token) => {
    if (!token || typeof token !== "string" || token.split(".").length < 2)
      return null;
    try {
      const base64Url = token.split(".")[1];
      // Base64URL -> Base64
      let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
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

  // Removed automatic bill creation on mount to avoid empty placeholder bills.

  // Focus Item Code input on mount (page load or after navigation)
  useEffect(() => {
    const t = setTimeout(() => itemCodeRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, []);

  // Item code search with keyboard navigation
  useEffect(() => {
    const handler = (e) => {
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
      const resp = await getItemByBarcode(code, 1);
      if (resp && resp.status === true && Array.isArray(resp.data)) {
        setSuggestions(resp.data);
        setHighlightIndex(0);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Barcode search failed:", err);
      setSuggestions([]);
    }
  };

  const selectSuggestedItem = (item) => {
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
        now.getDate()
      )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
        now.getSeconds()
      )}`;
      // Lock inputs immediately when Save is pressed to prevent further edits
      setInputsLocked(true);
      // Move focus to the Print Invoice button so the user can press Enter to print
      setTimeout(() => printButtonRef.current?.focus(), 0);
      if (!selectedItems || selectedItems.length === 0) {
        alert("Add at least one item before saving the bill.");
        return;
      }
      // Ensure bill exists (create if missing)
      let billIdToUse = currentBillId;
      if (!billIdToUse) {
        const createResp = await createBill({
          LocationID: 1,
          CustomerID: 1,
          CashierID: 1,
        });
        if (!(createResp && createResp.status === true && createResp.data)) {
          alert("Failed to create bill");
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
        alert(
          "Failed to save details: " +
            (resp?.error_message || resp?.message || JSON.stringify(resp))
        );
        return;
      }

      // After successfully adding details, write a first-last_bill.json dump without balance
      try {
        if (window?.electron?.ipcRenderer) {
          const interimPayload = {
            BillID: String(billIdToUse),
            date: dateStr,
            CashierID: String(window?.electron?.user?.id || "1"),
            CustomerName: (customerName || "").trim() || "Unknown",
            CustomerFName: (customerName || "").trim().split(/\s+/)[0] || "",
            CustomerLName:
              (customerName || "").trim().split(/\s+/).slice(1).join(" ") || "",
            Total: Number(total || 0),
            Discount: Number(totalDiscount || 0),
            CashAmount: parseFloat(cashPayAmount) || 0,
            CardAmount: parseFloat(cardAmount) || 0,
            Balance: 0,
            // Use the selectedItems so we include descriptive name and unit price
            Details: selectedItems.map((it) => ({
              ItemName:
                it.itemDescription ||
                it.Description ||
                it.itemName ||
                `Item ${it.inventoryID}`,
              QTY: Number(it.QTY || 1),
              UnitPrice: Number(
                it.itemUnitPrice || it.UnitPrice || it.price || 0
              ),
            })),
            // Instruct main process to only write JSON and not run the printer
            WriteOnly: true,
          };
          console.log(
            "Saving interim last_bill.json (write-only):",
            interimPayload
          );
          try {
            await window.electron.ipcRenderer.invoke(
              "print-receipt",
              interimPayload
            );
          } catch (ipcErr) {
            console.warn("Failed to write interim last_bill.json:", ipcErr);
          }
        }
      } catch (wErr) {
        console.warn("Interim last_bill write failed:", wErr);
      }

      // Complete billing and show returned change
      const payment = {
        CashAmount: parseFloat(cashPayAmount) || 0,
        CardAmount: parseFloat(cardAmount) || 0,
      };
      const completeResp = await completeBill(billIdToUse, payment);
      if (completeResp && completeResp.status === true) {
        setCreditBalance(completeResp.data || 0);
      } else {
        alert(
          "Failed to complete billing: " +
            (completeResp?.error_message ||
              completeResp?.message ||
              JSON.stringify(completeResp))
        );
      }
      // After a successful Save (complete billing), clear all UI and store state
      // except keep the change/balance amount so the operator can see it.
      if (completeResp && completeResp.status === true) {
        // Clear store transaction (items, customer, currentBillId)
        try {
          resetTransaction();
        } catch (e) {
          // ignore
        }

        // Clear local UI fields
        setItemCode("");
        setSuggestions([]);
        setHighlightIndex(-1);
        setCashPayAmount("0.00");
        setCardAmount("0.00");
        setCurrentBillId(null);

        // Keep creditBalance as returned by the server so operator sees the change
        setCreditBalance(completeResp.data || 0);

        // Update last_bill.json again with the returned balance
        try {
          if (window?.electron?.ipcRenderer) {
            const finalPayload = {
              BillID: String(billIdToUse),
              date: dateStr,
              CashierID: String(window?.electron?.user?.id || "1"),
              CustomerName: (customerName || "").trim() || "Unknown",
              CustomerFName: (customerName || "").trim().split(/\s+/)[0] || "",
              CustomerLName:
                (customerName || "").trim().split(/\s+/).slice(1).join(" ") ||
                "",
              Total: Number(total || 0),
              Discount: Number(totalDiscount || 0),
              CashAmount: parseFloat(cashPayAmount) || 0,
              CardAmount: parseFloat(cardAmount) || 0,
              Balance: Number(completeResp.data || 0),
              Details: selectedItems.map((it) => ({
                ItemName:
                  it.itemDescription ||
                  it.Description ||
                  it.itemName ||
                  `Item ${it.inventoryID}`,
                QTY: Number(it.QTY || 1),
                UnitPrice: Number(
                  it.itemUnitPrice || it.UnitPrice || it.price || 0
                ),
              })),
              WriteOnly: true,
            };
            console.log(
              "Updating final last_bill.json with balance:",
              finalPayload.Balance
            );
            try {
              await window.electron.ipcRenderer.invoke(
                "print-receipt",
                finalPayload
              );
            } catch (ipcErr2) {
              console.warn("Failed to write final last_bill.json:", ipcErr2);
            }
          }
        } catch (ufErr) {
          console.warn("Final last_bill write failed:", ufErr);
        }

        // Unlock inputs so operator can start a fresh transaction
        setInputsLocked(false);

        // Focus item code for convenience
        setTimeout(() => itemCodeRef.current?.focus(), 0);
      }
    } catch (err) {
      console.error("Add details failed:", err);
      // On failure, unlock inputs so the operator can correct and retry
      setInputsLocked(false);
      alert("Error saving bill details: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save current items as a temporary bill (create bill + add details, but do not complete)
  const handleSaveTemporary = async () => {
    try {
      setIsProcessing(true);
      if (!selectedItems || selectedItems.length === 0) {
        alert("Add at least one item before saving the temporary bill.");
        return;
      }

      // Create a bill first
      const createResp = await createBill({
        LocationID: 1,
        CustomerID: 1,
        CashierID: 1,
      });
      if (!(createResp && createResp.status === true && createResp.data)) {
        alert("Failed to create temporary bill");
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
        alert(
          "Failed to save temporary bill details: " +
            (detailsResp?.error_message ||
              detailsResp?.message ||
              JSON.stringify(detailsResp))
        );
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

      alert("Temporary bill saved (ID: " + billId + ")");
    } catch (err) {
      console.error("Save temporary failed:", err);
      alert("Error saving temporary bill: " + (err?.message || err));
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

      console.log("handlePrintInvoice: clicked", {
        selectedItemsLength: selectedItems.length,
        isPrinting,
      });

      // If ipcRenderer is not available, reset printing flag and notify the user
      if (!window?.electron?.ipcRenderer) {
        console.warn(
          "handlePrintInvoice: ipcRenderer not available in renderer"
        );
        setIsPrinting(false);
        alert("Printing is not available in this environment.");
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
        CashierID: cashierId,
        // Send customer name instead of an ID for printing as requested
        CustomerName: fullCustomerName,
        Total: Number(total || 0),
        Discount: Number(totalDiscount || 0),
        // Include payment amounts so the main process can write them to last_bill.json
        CashAmount: parseFloat(cashPayAmount) || 0,
        CardAmount: parseFloat(cardAmount) || 0,
        Balance: Number(creditBalance || 0),
        Details: selectedItems.map((it) => ({
          ItemName: it.itemName || it.ItemName || it.name || "Item",
          QTY: Number(it.QTY || 1),
          UnitPrice: Number(it.itemUnitPrice || it.UnitPrice || it.price || 0),
        })),
      };

      console.log("handlePrintInvoice: payload prepared", payload);
      const result = await window.electron.ipcRenderer.invoke(
        "print-receipt",
        payload
      );
      console.log("Print result:", result);

      if (!result || result.success !== true) {
        console.warn(
          "Printing failed or returned unsuccessful result:",
          result
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
      setCreditBalance(0);
      setCurrentBillId(null);
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
            b.BillID === resp.data.BillID ? { ...b, ...resp.data } : b
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
      const resp = await getTemporaryBills(1); // LocationID hardcoded as 1 per current flows
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
          resp.error_message || resp.message || "No temporary bills found"
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
          resp?.error_message || resp?.message || "Delete failed"
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
    setCreditBalance(0);
    // Reset local customer inputs as well
    setCustomerName("Customer");
    setCustomerPhone("");
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
        console.log("Renderer received last-bill-updated:", data);
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
            className="px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 transition"
          >
            Cash IN/Out
          </button>
          <button
            onClick={() => setShowCashCount(true)}
            className="px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 transition"
          >
            Cash Count
          </button>
          <button
            onClick={() => setShowTemporaryBills(true)}
            className="px-4 py-2 rounded-lg border border-sky-200 text-sky-700 bg-white hover:bg-sky-50 transition"
          >
            Temporary
          </button>
          <button
            onClick={() => setShowSearchByNameModal(true)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition"
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
            />
            <label className="text-sm">Phone</label>
            <input
              className="border px-2 py-1 w-44"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
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
                <input
                  className="border mt-1 px-2 py-2 w-full text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    setItemCode(val);
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
                    className={`p-2 cursor-pointer ${
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
                registerRowRef={(id, refs) => {
                  rowRefs.current.set(id, refs);
                }}
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
                // Move focus to Save button (do not click)
                e.preventDefault();
                saveButtonRef.current?.focus();
              }
            }}
            placeholder="0.00"
            ref={cardInputRef}
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
            <div className="text-2xl font-bold text-gray-800">00.00</div>
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
            disabled={isPrinting}
            className={`w-full px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg flex items-center justify-center gap-2 transition ${
              isPrinting ? "opacity-60 cursor-not-allowed" : ""
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
        onClose={() => setShowSearchByNameModal(false)}
        onSelectItem={selectSuggestedItem}
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
