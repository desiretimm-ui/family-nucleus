```javascript
exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const { type, details } = body;

  let searchTerm = "";
  let tip = "";

  // Handle the "other" custom type
  if (type === "other") {
    const customName = details.custom_type || "special event";
    searchTerm = `ideas for ${customName} party planning + decorations`;
    tip = `For a unique "${customName}" event, try searching local community boards or Pinterest for creative inspiration!`;
  } 
  else if (type === "birthday") {
    const theme = details.theme || "fun";
    const age = details.age || "";
    searchTerm = `${theme} birthday party supplies + decorations`;
    tip = `For a ${age}-year-old, check out themed party kits on Etsy or Amazon, and look for age-appropriate games!`;
  } 
  else if (type === "anniversary") {
    const vibe = details.vibe || "romantic";
    const years = details.years || "";
    searchTerm = `${vibe} anniversary dinner venues + catering`;
    tip = `Celebrating ${years} years? Consider a weekend getaway or a fancy dinner with a view to make it special.`;
  } 
  else if (type === "dinner") {
    const cuisine = details.cuisine || "local";
    const budget = details.budget || "";
    searchTerm = `best ${cuisine} restaurant catering for party`;
    tip = `With a budget of $${budget || 'moderate'} per person, look for family-style platters or buffet options to save costs.`;
  } 
  else {
    // Fallback
    searchTerm = `family event planning ideas`;
    tip = `Try searching for general event planning tips and checklists online!`;
  }

  const url = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;

  return {
    statusCode: 200,
    body: JSON.stringify({ url, tip })
  };
};
```