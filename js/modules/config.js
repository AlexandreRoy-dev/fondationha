/**
 * Site configuration - Fondation Honorer Aimer
 *
 * One live Stripe Payment Link (CAD, montant libre) for all donations.
 * Suggested amounts on the site are UX only; the donor confirms the amount on Stripe.
 */
export const STRIPE_PAYMENT_LINK =
  "https://donate.stripe.com/dRmdRafleac58QTakc8Ra00";

/** @deprecated Use STRIPE_PAYMENT_LINK; kept so older imports keep working */
export const STRIPE_DONATE_LINKS = {
  custom: STRIPE_PAYMENT_LINK,
};

export const DONATE_PRESETS = [25, 50, 100, 250];

export const DONATE_MIN_CAD = 5;

export const DONATE_MAILTO =
  "mailto:bonjour@fondationha.com?subject=Je%20souhaite%20faire%20un%20don&body=Bonjour%2C%0A%0AJe%20souhaite%20soutenir%20la%20Fondation%20Honorer%20Aimer.%0A%0A";

export const CONTACT_EMAIL = "bonjour@fondationha.com";

/** Lancement officiel: billetterie Zeffy */
export const EVENT_LAUNCH_URL =
  "https://www.zeffy.com/en-CA/ticketing/ensemble-lancement-de-la-fondation-honorer-aimer";
