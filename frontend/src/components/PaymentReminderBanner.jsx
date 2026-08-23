import { useEffect, useState, useCallback } from "react";
import { getPaymentReminder } from "../services/NotificationService";

/**
 * PaymentReminderBanner
 *
 * Fetches the payment reminder API once on mount.
 * Displays:
 *  - Payment Reminder: when remaining_days is between 1 and 7 (days <= 7 and > 0)
 *  - Payment Overdue: when remaining_days is 0 to -14 (overdue within grace period) or beyond
 *  - Hidden: when remaining_days > 7
 *
 * The banner auto-dismisses after 15 seconds or can be closed manually.
 */
const PaymentReminderBanner = () => {
  const [reminder, setReminder] = useState(null); // { next_billing_date, remaining_days }
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchReminder = async () => {
      try {
        const resp = await getPaymentReminder();
        if (cancelled) return;

        if (resp && resp.status === true && resp.data) {
          const days = Number(resp.data.remaining_days);
          // Only show banner if remaining_days <= 7
          if (!isNaN(days) && days <= 7) {
            setReminder({
              ...resp.data,
              remaining_days: days,
            });
            setVisible(true);
          }
        }
        // If status is false, data is null, or remaining_days > 7 → show nothing
      } catch (err) {
        console.error("[PaymentReminderBanner] fetch error:", err);
      }
    };

    fetchReminder();

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-dismiss after 15 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setDismissed(true);
    }, 15000);
    return () => clearTimeout(timer);
  }, [visible]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // Don't render if there's no reminder, dismissed, or remaining_days > 7
  if (!reminder || !visible || dismissed) return null;

  const { next_billing_date, remaining_days } = reminder;

  // Extra safety guard: do not render if days are greater than 7
  if (typeof remaining_days === "number" && remaining_days > 7) return null;

  // Determine severity for styling and messaging
  const isOverdue = remaining_days <= 0;
  const isUrgent = remaining_days > 0 && remaining_days <= 7;

  // Format the date nicely
  const formattedDate = (() => {
    try {
      const d = new Date(next_billing_date);
      if (isNaN(d.getTime())) return next_billing_date;
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return next_billing_date;
    }
  })();

  // Build the message
  let message = "";
  let icon = "";
  let label = "Payment Reminder";

  if (isOverdue) {
    label = "Payment Overdue";
    icon = "⚠️";
    if (remaining_days === 0) {
      message = `Your subscription payment is due today (${formattedDate}). Please pay now to avoid service interruption.`;
    } else {
      const overdueDays = Math.abs(remaining_days);
      const graceDaysLeft = 14 + remaining_days; // e.g. -1 -> 13 days left, -14 -> 0 days left
      if (graceDaysLeft > 0) {
        message = `Your billing was due on ${formattedDate} (${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue). Please pay within ${graceDaysLeft} day${graceDaysLeft === 1 ? "" : "s"} to avoid service interruption.`;
      } else {
        message = `Your billing was due on ${formattedDate} (${overdueDays} days overdue). Your 14-day grace period has expired. Please settle your payment immediately to restore service.`;
      }
    }
  } else if (isUrgent) {
    label = "Payment Reminder";
    icon = "🔔";
    message = `You have ${remaining_days} day${remaining_days === 1 ? "" : "s"} to pay the subscription to avoid interruption. Next billing: ${formattedDate}.`;
  } else {
    label = "Payment Reminder";
    icon = "📅";
    message = `You have ${remaining_days} day${remaining_days === 1 ? "" : "s"} to pay the subscription to avoid interruption. Next billing: ${formattedDate}.`;
  }

  // Severity-based styling
  const bannerStyle = {
    position: "fixed",
    top: "16px",
    right: "16px",
    zIndex: 9999,
    maxWidth: "420px",
    minWidth: "300px",
    padding: "14px 18px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    boxShadow: isOverdue
      ? "0 8px 30px rgba(220, 38, 38, 0.25), 0 2px 8px rgba(0,0,0,0.1)"
      : isUrgent
        ? "0 8px 30px rgba(234, 179, 8, 0.25), 0 2px 8px rgba(0,0,0,0.1)"
        : "0 8px 30px rgba(59, 130, 246, 0.2), 0 2px 8px rgba(0,0,0,0.1)",
    background: isOverdue
      ? "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)"
      : isUrgent
        ? "linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)"
        : "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    border: isOverdue
      ? "1px solid #fca5a5"
      : isUrgent
        ? "1px solid #fcd34d"
        : "1px solid #93c5fd",
    animation: "slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    fontFamily: "'Inter', sans-serif",
  };

  const iconStyle = {
    fontSize: "20px",
    lineHeight: "1",
    flexShrink: 0,
    marginTop: "1px",
  };

  const textStyle = {
    flex: 1,
    fontSize: "13px",
    lineHeight: "1.5",
    color: isOverdue ? "#991b1b" : isUrgent ? "#92400e" : "#1e40af",
    fontWeight: 500,
  };

  const labelStyle = {
    display: "block",
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "2px",
    color: isOverdue ? "#dc2626" : isUrgent ? "#d97706" : "#3b82f6",
  };

  const closeButtonStyle = {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "2px",
    lineHeight: "1",
    fontSize: "16px",
    color: isOverdue ? "#ef4444" : isUrgent ? "#f59e0b" : "#60a5fa",
    opacity: 0.7,
    flexShrink: 0,
    marginTop: "-2px",
    transition: "opacity 0.2s",
  };

  return (
    <>
      {/* Keyframes for slide-in animation */}
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(60px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
      <div
        id="payment-reminder-banner"
        role="alert"
        style={bannerStyle}
      >
        <span style={iconStyle}>{icon}</span>
        <div style={textStyle}>
          <span style={labelStyle}>
            {label}
          </span>
          {message}
        </div>
        <button
          onClick={handleDismiss}
          style={closeButtonStyle}
          onMouseEnter={(e) => (e.target.style.opacity = "1")}
          onMouseLeave={(e) => (e.target.style.opacity = "0.7")}
          aria-label="Dismiss notification"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </>
  );
};

export default PaymentReminderBanner;
