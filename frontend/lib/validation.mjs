export const serviceTypes = ["on-grid", "off-grid", "hybrid"];
export function validateRequest(raw, kind = "booking") {
  /** @type {Record<string,string>} */
  const data = {};
  /** @type {Record<string,string>} */
  const errors = {};
  const take = (key, max = 200) => {
    data[key] = typeof raw?.[key] === "string" ? raw[key].trim() : "";
    if (data[key].length > max) errors[key] = `Use ${max} characters or fewer.`;
    return data[key];
  };
  for (const key of ["full_name", "email", "phone"])
    take(key, key === "email" ? 254 : 120);
  if (!data.full_name) errors.full_name = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = "Enter a valid email address.";
  if (
    !/^[+\d() .-]{7,30}$/.test(data.phone) ||
    data.phone.replace(/\D/g, "").length < 7
  )
    errors.phone = "Enter a valid phone number with country code.";
  take("message", 4000);
  if (raw?.consent !== true)
    errors.consent = "Please agree to let us contact you about this request.";
  if (kind === "booking") {
    for (const key of [
      "service_type",
      "city",
      "property_type",
      "preferred_date",
      "preferred_time",
      "monthly_bill",
    ])
      take(key, 150);
    take("address", 500);
    if (!serviceTypes.includes(data.service_type))
      errors.service_type = "Choose on-grid, off-grid or hybrid.";
    if (!data.city) errors.city = "Enter your city or service location.";
    if (!["home", "business", "farm", "other"].includes(data.property_type))
      errors.property_type = "Choose a property type.";
    const today = new Date().toISOString().slice(0, 10);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(data.preferred_date) ||
      Number.isNaN(Date.parse(data.preferred_date)) ||
      new Date(data.preferred_date).toISOString().slice(0, 10) !==
        data.preferred_date ||
      data.preferred_date <= today
    )
      errors.preferred_date = "Choose a preferred date from tomorrow onward.";
    if (!["morning", "afternoon", "evening"].includes(data.preferred_time))
      errors.preferred_time = "Choose a preferred time window.";
    if (
      data.monthly_bill &&
      (!/^\d+(\.\d{1,2})?$/.test(data.monthly_bill) ||
        Number(data.monthly_bill) > 1000000)
    )
      errors.monthly_bill =
        "Enter a valid monthly bill between 0 and 1,000,000.";
  } else {
    take("subject", 200);
    if (!data.subject) errors.subject = "Enter a subject.";
    if (!data.message) errors.message = "Tell us how we can help.";
  }
  return { data, errors, valid: Object.keys(errors).length === 0 };
}
