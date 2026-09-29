"use client";

import { useState, type FormEvent, type InputHTMLAttributes } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import { useFlow } from "@/lib/state";
import { Button } from "../ui/Button";

type FieldName = "firstName" | "lastName" | "company" | "email" | "website" | "phone";
type Values = Record<FieldName, string>;

const REQUIRED: FieldName[] = ["firstName", "lastName", "company", "email", "website"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const FIELD_PROPS: Record<FieldName, InputHTMLAttributes<HTMLInputElement>> = {
  firstName: { autoComplete: "given-name" },
  lastName: { autoComplete: "family-name" },
  company: { autoComplete: "organization" },
  email: { type: "email", inputMode: "email", autoComplete: "email" },
  website: { type: "text", inputMode: "url", autoComplete: "url", placeholder: "www.example.bg" },
  phone: { type: "tel", inputMode: "tel", autoComplete: "tel" },
};

const EMPTY: Values = { firstName: "", lastName: "", company: "", email: "", website: "", phone: "" };

export function LeadForm() {
  const { t, submitLead, state } = useFlow();
  const [values, setValues] = useState<Values>(EMPTY);
  const [consent, setConsent] = useState(false); // never pre-checked
  const [errors, setErrors] = useState<Partial<Record<FieldName | "consent" | "submit", string>>>({});
  const [submitting, setSubmitting] = useState(false);

  if (state.leadSubmitted) {
    return (
      <section className="flex items-center gap-3 rounded-3xl bg-accent-50 p-6 text-accent-700">
        <CheckCircle2 className="size-6 shrink-0" />
        <p className="font-medium">{t("thankYou.text")}</p>
      </section>
    );
  }

  const validate = () => {
    const e: typeof errors = {};
    for (const f of REQUIRED) if (!values[f].trim()) e[f] = t("lead.errors.required");
    if (values.email.trim() && !EMAIL_RE.test(values.email.trim())) e.email = t("lead.errors.email");
    if (!consent) e.consent = t("lead.errors.consent");
    return e;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    try {
      await submitLead({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        company: values.company.trim(),
        email: values.email.trim().toLowerCase(),
        website: values.website.trim(),
        phone: values.phone.trim() || null,
      });
    } catch {
      setErrors({ submit: t("lead.errors.submit") });
      setSubmitting(false);
    }
  };

  const field = (name: FieldName, wide = false) => (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-sm font-medium text-navy-800">
        {t(`lead.fields.${name}`)}
        {name === "phone" && <span className="font-normal text-muted"> ({t("lead.fields.optional")})</span>}
      </span>
      <input
        {...FIELD_PROPS[name]}
        name={name}
        value={values[name]}
        onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
        aria-invalid={!!errors[name]}
        className={`h-13 w-full rounded-xl border bg-white px-4 text-base text-navy-900 outline-none transition-colors placeholder:text-muted/50 focus:border-accent-500 focus:ring-4 focus:ring-accent-500/15 ${
          errors[name] ? "border-red-400" : "border-line"
        }`}
      />
      {errors[name] && <span className="mt-1 block text-sm text-red-600">{errors[name]}</span>}
    </label>
  );

  return (
    <section id="lead" className="rounded-3xl bg-white p-6 shadow-lift ring-1 ring-accent-100 sm:p-9">
      <h2 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">{t("lead.title")}</h2>
      <p className="mt-2 text-lg text-muted">{t("lead.subtitle")}</p>

      <form onSubmit={onSubmit} noValidate className="mt-7 grid gap-4 sm:grid-cols-2">
        {field("firstName")}
        {field("lastName")}
        {field("company", true)}
        {field("email")}
        {field("website")}
        {field("phone", true)}

        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-canvas p-4">
            <input
              type="checkbox"
              name="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-accent-600"
            />
            <span className="text-[15px] leading-relaxed text-navy-800">{t("lead.consent")}</span>
          </label>
          {errors.consent && <span className="mt-1 block text-sm text-red-600">{errors.consent}</span>}
          {APP_CONFIG.privacyPolicyUrl && (
            <a
              href={APP_CONFIG.privacyPolicyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-accent-700 underline underline-offset-2"
            >
              {t("lead.privacyLink")}
            </a>
          )}
        </div>

        {errors.submit && <p className="text-sm text-red-600 sm:col-span-2">{errors.submit}</p>}

        <Button type="submit" disabled={submitting} className="w-full sm:col-span-2 sm:w-auto sm:justify-self-start">
          {submitting ? t("lead.submitting") : t("lead.submit")}
          {!submitting && <ArrowRight className="size-5" />}
        </Button>
      </form>
    </section>
  );
}
