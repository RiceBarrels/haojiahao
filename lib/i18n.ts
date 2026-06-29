import { enDictionary } from "../dictionaries/en";
import { zhDictionary, type Dictionary } from "../dictionaries/zh";

export const LOCALES = ["zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE = "zh" satisfies Locale;

export const LOCALE_NAMES = {
  zh: "中文",
  en: "English",
} as const satisfies Record<Locale, string>;

export const INTL_LOCALES = {
  zh: "zh-CN",
  en: "en-US",
} as const satisfies Record<Locale, string>;

export const dictionaries = {
  zh: zhDictionary,
  en: enDictionary,
} as const satisfies Record<Locale, Dictionary>;

export type { Dictionary };

export type ParsedPathLocale = {
  locale: Locale;
  hasLocale: boolean;
  pathname: string;
  pathnameWithoutLocale: string;
  segments: string[];
};

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && LOCALES.includes(value as Locale)
  );
}

export function toLocale(
  value: unknown,
  fallback: Locale = DEFAULT_LOCALE,
): Locale {
  return isLocale(value) ? value : fallback;
}

export function parsePathLocale(pathname: string): ParsedPathLocale {
  const normalizedPathname = normalizePathname(pathname);
  const segments = normalizedPathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const hasLocale = isLocale(firstSegment);
  const locale = hasLocale ? firstSegment : DEFAULT_LOCALE;
  const pathSegments = hasLocale ? segments.slice(1) : segments;

  return {
    locale,
    hasLocale,
    pathname: normalizedPathname,
    pathnameWithoutLocale: pathSegments.length
      ? `/${pathSegments.join("/")}`
      : "/",
    segments: pathSegments,
  };
}

export function getPathLocale(pathname: string): Locale {
  return parsePathLocale(pathname).locale;
}

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return dictionaries[locale];
}

export function getPreferredLocale(
  acceptLanguage: string | null | undefined,
  fallback: Locale = DEFAULT_LOCALE,
): Locale {
  if (!acceptLanguage) {
    return fallback;
  }

  const preferredLanguages = acceptLanguage
    .split(",")
    .map((entry, index) => {
      const [languageRange, ...parameters] = entry.trim().split(";");
      const qualityParameter = parameters.find((parameter) =>
        parameter.trim().startsWith("q="),
      );
      const quality = qualityParameter
        ? Number(qualityParameter.trim().slice(2))
        : 1;

      return {
        languageRange: languageRange.toLowerCase(),
        quality: Number.isFinite(quality) ? quality : 0,
        index,
      };
    })
    .filter(({ languageRange, quality }) => languageRange && quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const { languageRange } of preferredLanguages) {
    const baseLanguage = languageRange.split("-")[0];
    const locale = LOCALES.find(
      (candidate) =>
        languageRange === candidate || baseLanguage === candidate,
    );

    if (locale) {
      return locale;
    }
  }

  return fallback;
}

export function formatPrice(
  cents: number,
  locale: Locale = DEFAULT_LOCALE,
  currency = "USD",
): string {
  const amount = Number.isFinite(cents) ? cents / 100 : 0;

  return new Intl.NumberFormat(INTL_LOCALES[locale], {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatTime(value: Date | string | null | undefined): string {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return "";
    }

    return `${padTime(value.getHours())}:${padTime(value.getMinutes())}`;
  }

  const trimmedValue = value.trim();
  const timeMatch = /^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(
    trimmedValue,
  );

  if (!timeMatch) {
    return trimmedValue;
  }

  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);

  if (hours > 23 || minutes > 59) {
    return trimmedValue;
  }

  return `${padTime(hours)}:${padTime(minutes)}`;
}

function normalizePathname(pathname: string): string {
  const trimmedPathname = pathname.trim();

  if (!trimmedPathname) {
    return "/";
  }

  try {
    return new URL(trimmedPathname, "http://local").pathname || "/";
  } catch {
    return trimmedPathname.startsWith("/")
      ? trimmedPathname
      : `/${trimmedPathname}`;
  }
}

function padTime(value: number): string {
  return String(value).padStart(2, "0");
}
