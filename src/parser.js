const parse = (string) => {
  const parser = new DOMParser();
  const parsedDoc = parser.parseFromString(string, "application/xml");
  const errorEl = parsedDoc.querySelector("parsererror");
  if (errorEl) {
    const error = new Error("errors.noValidRss");
    error.isParsingError = true;
    throw error;
  }
  const domItems = parsedDoc.querySelectorAll("item");
  return {
    title: parsedDoc.querySelector("title").textContent,
    link: parsedDoc.querySelector("link").textContent,
    description: parsedDoc.querySelector("description").textContent,
    items: Array.from(domItems).map((item) => ({
      title: item.querySelector("title").textContent,
      description: item.querySelector("description").textContent,
      link: item.querySelector("link").textContent,
    })),
  };
};
export default parse;
