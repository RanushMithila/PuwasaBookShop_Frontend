import { useState, useRef, useEffect } from "react";

const RefundSuccessModal = ({
  isOpen,
  onClose,
  refundId,
  voucherCode,
  expireDate,
  billId,
  refundTotal,
  message,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const closeButtonRef = useRef(null);
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setShowEmailForm(false);
      setEmail("");
      setEmailSent(false);
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (showEmailForm) {
      setTimeout(() => emailInputRef.current?.focus(), 50);
    }
  }, [showEmailForm]);

  if (!isOpen) return null;

  // Copy voucher code to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(voucherCode || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // Print voucher via IPC (writes voucher.json and runs print.exe)
  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const ipc = window?.electron?.ipcRenderer;
      if (ipc && ipc.invoke) {
        const result = await ipc.invoke("print-voucher", {
          RefundID: refundId,
          VoucherCode: voucherCode,
          ExpireDate: expireDate,
          BillID: billId,
          RefundTotal: refundTotal,
        });
        console.log("[VoucherPrint] Result:", result);
      } else {
        console.warn("[VoucherPrint] IPC not available (running in browser?)");
      }
    } catch (err) {
      console.error("[VoucherPrint] Error:", err);
    } finally {
      setIsPrinting(false);
    }
  };

  // Dummy send email
  const handleSendEmail = () => {
    if (!email.trim()) return;
    setEmailSending(true);
    // Simulate sending — just a dummy delay
    setTimeout(() => {
      setEmailSending(false);
      setEmailSent(true);
      console.log(
        `[VoucherEmail] Dummy email sent to ${email} with voucher ${voucherCode}`,
      );
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[100]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-emerald-200">
        {/* Header */}
        <div className="p-6 flex flex-col items-center text-center bg-emerald-50">
          <div className="text-emerald-500 mb-3">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Refund Successful
          </h2>
          <p className="text-gray-600 text-sm">{message}</p>
        </div>

        {/* Voucher Details */}
        <div className="px-6 py-4 space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Refund ID</span>
            <span className="font-semibold text-gray-800">{refundId}</span>
          </div>

          {/* Voucher code row with copy button */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Voucher Code</div>
              <div className="text-lg font-bold text-indigo-700 tracking-wider font-mono">
                {voucherCode}
              </div>
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition border-none cursor-pointer ${
                copied
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {copied ? (
                <>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Email form (expandable) */}
        {showEmailForm && (
          <div className="px-6 pb-3">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
              <label className="text-xs font-medium text-gray-600">
                Recipient Email
              </label>
              <div className="flex gap-2">
                <input
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@email.com"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendEmail();
                  }}
                  disabled={emailSent}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  onClick={handleSendEmail}
                  disabled={emailSending || emailSent || !email.trim()}
                  className={`px-4 py-2 rounded-lg text-white text-xs font-semibold transition border-none cursor-pointer ${
                    emailSent
                      ? "bg-emerald-500"
                      : emailSending || !email.trim()
                        ? "bg-indigo-300 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {emailSent
                    ? "✓ Sent"
                    : emailSending
                      ? "Sending…"
                      : "Send"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-6 pb-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition border-none cursor-pointer flex items-center justify-center gap-1.5 ${
                isPrinting
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-amber-500 text-white hover:bg-amber-600"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              {isPrinting ? "Printing…" : "Print Voucher"}
            </button>
            <button
              onClick={() => {
                setShowEmailForm(!showEmailForm);
                setEmailSent(false);
              }}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Send Email
            </button>
          </div>
        </div>

        {/* Close / OK button */}
        <div className="p-4 bg-gray-50 flex justify-center border-t border-gray-200">
          <button
            ref={closeButtonRef}
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === "Enter") onClose();
            }}
            className="w-full py-3 px-6 text-white text-lg font-bold rounded-xl shadow-lg transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 border-none cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefundSuccessModal;
