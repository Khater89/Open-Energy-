export const company = {
  name: "Open Energy",
  email: "abdelrahman.khater.elc@gmail.com",
  phones: [
    {
      local: "0790619770",
      international: "+962790619770",
      whatsapp: "962790619770",
    },
    {
      local: "0790931706",
      international: "+962790931706",
      whatsapp: "962790931706",
    },
  ],
};
export function whatsappUrl(number: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent("Hello Open Energy! I’d like to discuss a solar energy solution.")}`;
}
