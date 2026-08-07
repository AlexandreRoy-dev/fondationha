/**
 * Site configuration - Fondation Honorer Aimer
 *
 * One live Stripe Payment Link (CAD, montant libre) for all donations.
 * Selected/custom amounts are passed via ?__prefilled_amount= (cents).
 */
export const STRIPE_PAYMENT_LINK =
  "https://donate.stripe.com/eVq9AU2ys83XaZ17808Ra01";

/** @deprecated Use STRIPE_PAYMENT_LINK; kept so older imports keep working */
export const STRIPE_DONATE_LINKS = {
  custom: STRIPE_PAYMENT_LINK,
};

export const DONATE_PRESETS = [25, 50, 100, 250];

/** Stripe CAD minimum charge is $0.50; we allow from $1. */
export const DONATE_MIN_CAD = 1;

export const DONATE_MAILTO =
  "mailto:bonjour@fondationha.com?subject=Je%20souhaite%20faire%20un%20don&body=Bonjour%2C%0A%0AJe%20souhaite%20soutenir%20la%20Fondation%20Honorer%20Aimer.%0A%0A";

export const CONTACT_EMAIL = "bonjour@fondationha.com";

/** Lancement officiel: billetterie Zeffy */
export const EVENT_LAUNCH_URL =
  "https://www.zeffy.com/en-CA/ticketing/ensemble-lancement-de-la-fondation-honorer-aimer";

/** Page Facebook de la fondation */
export const FACEBOOK_URL =
  "https://www.facebook.com/profile.php?id=61590563364527";
