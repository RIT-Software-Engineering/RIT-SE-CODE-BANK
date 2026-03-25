/**
 * Utility functions for table sorting logic.
 * Centralizes sorting comparators and handlers.
 */

/**
 * Compare two values in descending order.
 * Automatically handles date parsing for date fields.
 *
 * @param {*} a - First value to compare
 * @param {*} b - Second value to compare
 * @param {string} orderBy - Field name being sorted (identifies date fields)
 * @param {string[]} dateFields - Array of field names that should be treated as dates (default: ["createdAt"])
 * @returns {number} -1 if a > b, 1 if b > a, 0 if equal
 */
export function descendingComparator(a, b, orderBy, dateFields = ["createdAt"]) {
  const isDateField = dateFields.includes(orderBy);

  const aVal = isDateField ? new Date(a[orderBy]) : (a[orderBy] ?? "");
  const bVal = isDateField ? new Date(b[orderBy]) : (b[orderBy] ?? "");

  if (bVal < aVal) return -1;
  if (bVal > aVal) return 1;
  return 0;
}

/**
 * Returns a comparator function for sorting arrays.
 *
 * @param {string} order - Sort direction: "asc" | "desc"
 * @param {string} orderBy - Field name to sort by
 * @param {string[]} dateFields - Array of field names that should be treated as dates
 * @returns {Function} Comparator function for array.sort()
 */
export function getComparator(order, orderBy, dateFields = ["createdAt"]) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy, dateFields)
    : (a, b) => -descendingComparator(a, b, orderBy, dateFields);
}

/**
 * Generic hook pattern for managing table sort state.
 * Note: Import and use in your component for consistency.
 *
 * @example
 * const [order, setOrder] = useState("desc");
 * const [orderBy, setOrderBy] = useState("createdAt");
 *
 * const handleSort = (column) => {
 *   if (orderBy === column) {
 *     setOrder(prev => prev === "asc" ? "desc" : "asc");
 *   } else {
 *     setOrderBy(column);
 *     setOrder("asc");
 *   }
 * };
 *
 * const sorted = useMemo(() => {
 *   return [...data].sort(getComparator(order, orderBy, ["createdAt", "updatedAt"]));
 * }, [data, order, orderBy]);
 */

