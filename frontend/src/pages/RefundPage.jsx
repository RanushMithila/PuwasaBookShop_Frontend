import { useState, useRef, useEffect } from "react";
import { getBill } from "../services/BillingService";
import { processRefund, getVoucherByCode } from "../services/RefundService";
import AlertModal from "../components/AlertModal";
import RefundSuccessModal from "../components/RefundSuccessModal";

const RefundPage = () => {
  // Bill lookup
  const [billIdInput, setBillIdInput] = useState("");
  const [billData, setBillData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const billIdRef = useRef();

  // Items selection — map of DetailID → { checked: bool, refundQty: number }
  const [selections, setSelections] = useState({});

  // Alert Modal
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // Refund Success Modal
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    refundId: "",
    voucherCode: "",
    expireDate: "",
    billId: "",
    refundTotal: 0,
    message: "",
  });

  // Focus bill ID input on mount
  useEffect(() => {
    const t = setTimeout(() => billIdRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, []);

  // ── Load Bill ──
  const handleLoadBill = async () => {
    const id = billIdInput.trim();
    if (!id) {
      setAlertConfig({
        isOpen: true,
        title: "Invalid Bill ID",
        message: "Please enter a valid Bill ID.",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    setBillData(null);
    setSelections({});

    try {
      const resp = await getBill(id);
      if (resp && resp.status === true && resp.data) {
        setBillData(resp.data);

        // Initialise selections — all unchecked, refundQty = original QTY
        const init = {};
        (resp.data.Details || []).forEach((d) => {
          init[d.DetailID] = { checked: false, refundQty: d.QTY };
        });
        setSelections(init);
      } else {
        setAlertConfig({
          isOpen: true,
          title: "Bill Not Found",
          message:
            resp?.error_message || resp?.message || "Could not load the bill.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Load bill failed:", err);
      setAlertConfig({
        isOpen: true,
        title: "Error",
        message: err.message || "Failed to load bill.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Toggle item checkbox ──
  const toggleItem = (detailId) => {
    setSelections((prev) => ({
      ...prev,
      [detailId]: { ...prev[detailId], checked: !prev[detailId]?.checked },
    }));
  };

  // ── Update refund quantity ──
  const updateRefundQty = (detailId, qty, maxQty) => {
    const clamped = Math.max(1, Math.min(maxQty, parseInt(qty, 10) || 1));
    setSelections((prev) => ({
      ...prev,
      [detailId]: { ...prev[detailId], refundQty: clamped },
    }));
  };

  // ── Computed refund total ──
  const getRefundablePrice = (item) => {
    return item.UnitPrice - (item.Discount || 0);
  };

  const getRefundTotal = () => {
    if (!billData?.Details) return 0;
    let total = 0;
    billData.Details.forEach((d) => {
      const sel = selections[d.DetailID];
      if (sel?.checked) {
        total += getRefundablePrice(d) * sel.refundQty;
      }
    });
    return parseFloat(total.toFixed(2));
  };

  const selectedCount = Object.values(selections).filter(
    (s) => s.checked,
  ).length;

  // ── Process Refund ──
  const handleRefund = async () => {
    if (!billData) return;

    const items = [];
    billData.Details.forEach((d) => {
      const sel = selections[d.DetailID];
      if (sel?.checked) {
        items.push({ BillDetailID: d.DetailID, QTY: sel.refundQty });
      }
    });

    if (items.length === 0) {
      setAlertConfig({
        isOpen: true,
        title: "No Items Selected",
        message: "Please select at least one item to refund.",
        type: "info",
      });
      return;
    }

    setIsRefunding(true);
    try {
      const resp = await processRefund({ BillID: billData.BillID, Items: items });
      if (resp && resp.status === true) {
        const refundIdVal = resp.data?.RefundID ?? "-";
        const voucher = resp.data?.VoucherCode ?? "-";
        let expireDate = "";
        let voucherValue = getRefundTotal();

        // Fetch full voucher details from voucher API to get ExpiryDate and Value
        if (voucher && voucher !== "-") {
          try {
            const voucherResp = await getVoucherByCode(voucher);
            console.log("[Refund] Voucher details:", voucherResp);
            if (voucherResp && voucherResp.status === true && voucherResp.data) {
              expireDate = voucherResp.data.ExpiryDate || "";
              voucherValue = Number(voucherResp.data.Value || voucherValue);
            }
          } catch (vErr) {
            console.warn("[Refund] Could not fetch voucher details:", vErr);
          }
        }

        // Automatically write voucher.json via IPC so it's always up-to-date
        const ipc = window?.electron?.ipcRenderer;
        if (ipc && ipc.invoke) {
          try {
            await ipc.invoke("print-voucher", {
              RefundID: refundIdVal,
              VoucherCode: voucher,
              ExpireDate: expireDate,
              BillID: billData.BillID,
              RefundTotal: voucherValue,
              WriteOnly: true,
            });
            console.log("[Refund] voucher.json written successfully");
          } catch (ipcErr) {
            console.error("[Refund] Failed to write voucher.json:", ipcErr);
          }
        }

        setSuccessModal({
          isOpen: true,
          refundId: refundIdVal,
          voucherCode: voucher,
          expireDate: expireDate,
          billId: billData.BillID,
          refundTotal: voucherValue,
          message: resp.message || "Refund processed successfully.",
        });

        // Reset form
        setBillData(null);
        setSelections({});
        setBillIdInput("");
      } else {
        setAlertConfig({
          isOpen: true,
          title: "Refund Failed",
          message:
            resp?.error_message ||
            resp?.message ||
            "Unknown error while processing refund.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Refund failed:", err);
      setAlertConfig({
        isOpen: true,
        title: "Refund Error",
        message: err.message || "Failed to process refund.",
        type: "error",
      });
    } finally {
      setIsRefunding(false);
    }
  };

  const handleCloseAlert = () => {
    setAlertConfig({ ...alertConfig, isOpen: false });
    setTimeout(() => billIdRef.current?.focus(), 0);
  };

  const handleCloseSuccess = () => {
    setSuccessModal((prev) => ({ ...prev, isOpen: false }));
    setTimeout(() => billIdRef.current?.focus(), 0);
  };

  // ── Render ──
  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden w-full bg-gray-50">
      {/* ── LEFT PANEL: Lookup + Items ── */}
      <div className="flex flex-col flex-grow w-full lg:w-auto p-4 lg:p-6 overflow-hidden h-full">
        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">↩️</span> Refund
        </h1>

        {/* Bill ID search bar */}
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-medium text-gray-700">Bill ID</label>
          <input
            ref={billIdRef}
            type="text"
            value={billIdInput}
            onChange={(e) => setBillIdInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLoadBill();
            }}
            placeholder="Enter Bill ID"
            className="border border-gray-300 rounded-lg px-3 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
          />
          <button
            onClick={handleLoadBill}
            disabled={isLoading}
            className={`px-5 py-2 rounded-lg text-white text-sm font-medium transition ${
              isLoading
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isLoading ? "Loading…" : "Load Bill"}
          </button>
        </div>

        {/* Bill header info */}
        {billData && (
          <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-600 bg-white rounded-lg p-3 shadow-sm border border-gray-200">
            <span>
              <strong>Bill #</strong> {billData.BillID}
            </span>
            <span>
              <strong>Customer ID:</strong> {billData.CustomerID}
            </span>
            <span>
              <strong>Location:</strong> {billData.LocationID}
            </span>
            <span>
              <strong>Total:</strong>{" "}
              <span className="font-semibold text-gray-800">
                Rs. {Number(billData.Total).toFixed(2)}
              </span>
            </span>
            <span>
              <strong>Discount:</strong> Rs.{" "}
              {Number(billData.Discount).toFixed(2)}
            </span>
          </div>
        )}

        {/* Items table */}
        {billData && billData.Details && billData.Details.length > 0 ? (
          <div className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-3 w-10">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="px-4 py-3">Item Name</th>
                  <th className="px-4 py-3 text-right">Refundable Price</th>
                  <th className="px-4 py-3 text-center">Original QTY</th>
                  <th className="px-4 py-3 text-center">Refund QTY</th>
                  <th className="px-4 py-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {billData.Details.map((item) => {
                  const sel = selections[item.DetailID] || {
                    checked: false,
                    refundQty: item.QTY,
                  };
                  const refundablePrice = getRefundablePrice(item);
                  const lineTotal = sel.checked
                    ? refundablePrice * sel.refundQty
                    : 0;
                  return (
                    <tr
                      key={item.DetailID}
                      onClick={() => toggleItem(item.DetailID)}
                      className={`border-b last:border-b-0 transition cursor-pointer ${
                        sel.checked
                          ? "bg-indigo-50 hover:bg-indigo-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={sel.checked}
                          onChange={() => toggleItem(item.DetailID)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 accent-indigo-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {item.ItemName}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        Rs. {refundablePrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">
                        {item.QTY}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="1"
                          max={item.QTY}
                          value={sel.refundQty}
                          disabled={!sel.checked}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            updateRefundQty(
                              item.DetailID,
                              e.target.value,
                              item.QTY,
                            )
                          }
                          className={`w-16 text-center border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                            sel.checked
                              ? "border-indigo-300 bg-white"
                              : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {sel.checked ? (
                          <span className="text-indigo-700">
                            Rs. {lineTotal.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : billData ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            No items found in this bill.
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Enter a Bill ID and click &quot;Load Bill&quot; to begin.
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL: Summary & Action ── */}
      <div className="w-full lg:w-80 xl:w-96 bg-white border-l border-gray-200 flex flex-col p-5 shadow-inner">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Refund Summary
        </h2>

        <div className="flex-1 flex flex-col gap-4">
          {/* Selected count */}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Selected Items</span>
            <span className="font-semibold text-gray-800">{selectedCount}</span>
          </div>

          {/* Refund total */}
          <div className="flex justify-between text-lg font-bold text-gray-800 border-t border-gray-200 pt-4">
            <span>Refund Total</span>
            <span className="text-indigo-700">
              Rs. {getRefundTotal().toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleRefund}
            disabled={isRefunding || selectedCount === 0 || !billData}
            className={`w-full py-3 rounded-lg text-white text-sm font-semibold transition ${
              isRefunding || selectedCount === 0 || !billData
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]"
            }`}
          >
            {isRefunding ? "Processing…" : "Process Refund"}
          </button>

          <button
            onClick={() => {
              setBillData(null);
              setSelections({});
              setBillIdInput("");
              setTimeout(() => billIdRef.current?.focus(), 0);
            }}
            className="w-full py-3 rounded-lg text-gray-700 text-sm font-medium border border-gray-300 hover:bg-gray-100 transition active:scale-[0.98]"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Alert Modal (errors / info) */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={handleCloseAlert}
      />

      {/* Refund Success Modal (with copy, print, email) */}
      <RefundSuccessModal
        isOpen={successModal.isOpen}
        onClose={handleCloseSuccess}
        refundId={successModal.refundId}
        voucherCode={successModal.voucherCode}
        expireDate={successModal.expireDate}
        billId={successModal.billId}
        refundTotal={successModal.refundTotal}
        message={successModal.message}
      />
    </div>
  );
};

export default RefundPage;
