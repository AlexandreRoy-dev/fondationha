import {
  STRIPE_PAYMENT_LINK,
  DONATE_MAILTO,
  DONATE_MIN_CAD,
} from "./config.js";

function hasStripeLink() {
  return (
    typeof STRIPE_PAYMENT_LINK === "string" &&
    STRIPE_PAYMENT_LINK.startsWith("http")
  );
}

/**
 * Build checkout URL with the donor's amount prefilled on Stripe.
 * Amount is in CAD dollars; Stripe expects cents via __prefilled_amount.
 */
function checkoutUrl(amountCad) {
  if (!hasStripeLink()) return DONATE_MAILTO;

  const url = new URL(STRIPE_PAYMENT_LINK);
  if (typeof amountCad === "number" && Number.isFinite(amountCad)) {
    const cents = Math.round(amountCad * 100);
    if (cents > 0) {
      url.searchParams.set("__prefilled_amount", String(cents));
    }
  }
  return url.toString();
}

function openCheckout(url) {
  if (url.startsWith("mailto:")) {
    window.location.href = url;
    return;
  }
  window.location.assign(url);
}

function parseCustomAmount(raw) {
  const normalized = String(raw).replace(",", ".").replace(/[^\d.]/g, "");
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100) / 100;
}

/** Header / nav CTAs → Stripe donation link (or mailto fallback). */
export function initDonateLinks() {
  const href = checkoutUrl();
  const external = href.startsWith("http");

  document.querySelectorAll("[data-donate]").forEach((el) => {
    if (el.closest("[data-donate-form]")) return;
    el.setAttribute("href", href);
    if (external) {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    } else {
      el.removeAttribute("target");
      el.removeAttribute("rel");
    }
  });
}

/**
 * Amount picker → Stripe Payment Link with that amount prefilled.
 * form[data-donate-form] + [data-donate-amount] + [data-donate-custom] + [data-donate-submit]
 */
export function initDonateForms() {
  document.querySelectorAll("[data-donate-form]").forEach((form) => {
    const amountButtons = [...form.querySelectorAll("[data-donate-amount]")];
    const customInput = form.querySelector("[data-donate-custom]");
    const submit = form.querySelector("[data-donate-submit]");
    const errorEl = form.querySelector("[data-donate-error]");
    const hintEl = form.querySelector("[data-donate-hint]");
    let selected = 50;

    const setError = (message) => {
      if (!errorEl) return;
      errorEl.textContent = message || "";
      errorEl.hidden = !message;
    };

    const updateHint = () => {
      if (!hintEl) return;
      if (!hasStripeLink()) {
        hintEl.hidden = true;
        return;
      }
      hintEl.hidden = true;
    };

    const selectPreset = (value) => {
      selected = value;
      amountButtons.forEach((btn) => {
        const isActive = Number(btn.dataset.donateAmount) === value;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
      });
      if (customInput && document.activeElement !== customInput) {
        customInput.value = "";
      }
      setError("");
      updateHint();
    };

    amountButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        selectPreset(Number(btn.dataset.donateAmount));
      });
    });

    if (customInput) {
      const markCustom = () => {
        selected = "custom";
        amountButtons.forEach((btn) => {
          btn.classList.remove("is-active");
          btn.setAttribute("aria-pressed", "false");
        });
        setError("");
        updateHint();
      };
      customInput.addEventListener("focus", markCustom);
      customInput.addEventListener("input", markCustom);
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      let amountCad = selected;

      if (selected === "custom" || (customInput && customInput.value.trim())) {
        const parsed = parseCustomAmount(customInput?.value ?? "");
        if (parsed === null) {
          setError("Entrez un montant valide.");
          customInput?.focus();
          return;
        }
        if (parsed < DONATE_MIN_CAD) {
          setError(`Le montant minimum est de ${DONATE_MIN_CAD} $.`);
          customInput?.focus();
          return;
        }
        amountCad = parsed;
      }

      if (typeof amountCad !== "number" || amountCad < DONATE_MIN_CAD) {
        setError("Choisissez un montant pour continuer.");
        return;
      }

      openCheckout(checkoutUrl(amountCad));
    });

    const defaultBtn = amountButtons.find(
      (btn) => Number(btn.dataset.donateAmount) === 50
    );
    if (defaultBtn) selectPreset(50);
    else if (amountButtons[0]) {
      selectPreset(Number(amountButtons[0].dataset.donateAmount));
    } else {
      updateHint();
    }

    if (submit && !hasStripeLink()) {
      submit.textContent = "Écrire pour faire un don";
    }
  });
}
