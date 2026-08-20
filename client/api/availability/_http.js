export function applyCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function sendError(res, error) {
  console.error(error);
  res.status(error.status || 500).json({
    error: error.message || "Something went wrong.",
  });
}
