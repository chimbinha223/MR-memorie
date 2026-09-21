import { useSiteContent } from "./content-context";
import { useEffect, useMemo, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  buildWhatsApp,
  formatContactMessage,
  normalizeCategory,
  todayInLisbon,
  validateContact,
} from "./contact";
import type { ContactErrors, ContactField, ContactValues } from "./contact";

interface ContactFormProps {
  initialCategory?: string;
}

export default function ContactForm({ initialCategory }: ContactFormProps) {
  const { brand, services } = useSiteContent().content;
  const labels = useMemo(
    () => Object.fromEntries(services.map((s) => [s.id, s.title])),
    [services],
  );
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<ContactValues>({
    name: "",
    category: normalizeCategory(initialCategory, labels),
    date: "",
    location: brand.location,
    birthdayType: "a-definir",
    message: "",
  });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [preview, setPreview] = useState<{ message: string; url: string } | null>(null);

  useEffect(() => {
    setValues((current) => ({ ...current, category: normalizeCategory(initialCategory, labels) }));
    setErrors({});
    setPreview(null);
  }, [initialCategory, labels]);

  useEffect(() => {
    if (preview) previewRef.current?.focus();
  }, [preview]);

  function update(field: ContactField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setPreview(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateContact(values, todayInLisbon(), labels);
    const dateInput = formRef.current?.elements.namedItem("date");
    if (dateInput instanceof HTMLInputElement && dateInput.validity.badInput)
      nextErrors.date = "Complete a data ou deixe o campo vazio.";
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      setPreview(null);
      const field = formRef.current?.elements.namedItem(firstError);
      if (field instanceof HTMLElement) field.focus();
      return;
    }
    setPreview({
      message: formatContactMessage(values, labels, brand.name),
      url: buildWhatsApp(values, brand.whatsapp, labels, brand.name),
    });
  }

  const fieldId = (field: ContactField) => `${id}-${field}`;
  const errorId = (field: ContactField) => `${id}-${field}-error`;
  const error = (field: ContactField) =>
    errors[field] ? (
      <p className="field-error" id={errorId(field)}>
        {errors[field]}
      </p>
    ) : null;

  return (
    <form className="contact-form" ref={formRef} onSubmit={submit} noValidate>
      <div className="form-grid">
        <div className="field">
          <label htmlFor={fieldId("name")}>
            Seu nome <span aria-hidden="true">*</span>
          </label>
          <input
            id={fieldId("name")}
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? errorId("name") : undefined}
          />
          {error("name")}
        </div>
        <div className="field">
          <label htmlFor={fieldId("category")}>
            Qual experiência? <span aria-hidden="true">*</span>
          </label>
          <select
            className="category-select"
            id={fieldId("category")}
            name="category"
            value={values.category}
            onChange={(event) => update("category", event.target.value)}
            required
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? errorId("category") : undefined}
          >
            <option value="">Escolha uma experiência</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          {error("category")}
        </div>
        {values.category === "aniversarios" && (
          <div className="field field-wide">
            <label htmlFor={fieldId("birthdayType")}>Como você quer comemorar?</label>
            <select
              id={fieldId("birthdayType")}
              name="birthdayType"
              value={values.birthdayType}
              onChange={(event) => update("birthdayType", event.target.value)}
              aria-invalid={Boolean(errors.birthdayType)}
              aria-describedby={errors.birthdayType ? errorId("birthdayType") : undefined}
            >
              <option value="a-definir">Ainda vou definir</option>
              <option value="festa">Cobertura de festa</option>
              <option value="ensaio">Ensaio comemorativo</option>
            </select>
            {error("birthdayType")}
          </div>
        )}
        <div className="field">
          <label htmlFor={fieldId("date")}>
            Data desejada <span>(opcional)</span>
          </label>
          <input
            id={fieldId("date")}
            name="date"
            type="date"
            min={todayInLisbon()}
            value={values.date}
            onChange={(event) => update("date", event.target.value)}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={`${id}-date-note${errors.date ? ` ${errorId("date")}` : ""}`}
          />
          <p className="form-note" id={`${id}-date-note`}>
            Pode deixar em branco se a data ainda estiver a definir.
          </p>
          {error("date")}
        </div>
        <div className="field">
          <label htmlFor={fieldId("location")}>
            Cidade ou local <span aria-hidden="true">*</span>
          </label>
          <input
            id={fieldId("location")}
            name="location"
            autoComplete="address-level2"
            value={values.location}
            onChange={(event) => update("location", event.target.value)}
            required
            aria-invalid={Boolean(errors.location)}
            aria-describedby={errors.location ? errorId("location") : undefined}
          />
          {error("location")}
        </div>
        <div className="field field-wide">
          <label htmlFor={fieldId("message")}>
            Conte um pouco da sua ideia <span>(opcional)</span>
          </label>
          <textarea
            id={fieldId("message")}
            name="message"
            rows={5}
            value={values.message}
            onChange={(event) => update("message", event.target.value)}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={`${id}-message-note${errors.message ? ` ${errorId("message")}` : ""}`}
          />
          <p className="form-note" id={`${id}-message-note`}>
            {Array.from(values.message ?? "").length}/1.200 caracteres
          </p>
          {error("message")}
        </div>
      </div>
      {Object.values(errors).some(Boolean) && (
        <p className="field-error" role="alert">
          Revise os campos indicados para preparar sua mensagem.
        </p>
      )}
      <div className="form-action">
        <button type="submit" className="pill">
          Preparar mensagem <span aria-hidden="true">↗</span>
        </button>
        <p className="form-note">
          Campos com * são obrigatórios. Você revisa a mensagem antes de abrir o WhatsApp.
        </p>
      </div>
      {preview && (
        <div
          className="request-preview"
          ref={previewRef}
          tabIndex={-1}
          aria-labelledby={`${id}-preview-title`}
        >
          <h3 id={`${id}-preview-title`}>Sua mensagem está pronta para revisar</h3>
          <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{preview.message}</p>
          <a
            className="whatsapp-action pill"
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir WhatsApp <span aria-hidden="true">↗</span>
          </a>
          <p className="form-note">
            O WhatsApp será aberto em outra aba. Você ainda precisa tocar em enviar por lá; a
            mensagem não foi enviada por este site.
          </p>
        </div>
      )}
    </form>
  );
}
