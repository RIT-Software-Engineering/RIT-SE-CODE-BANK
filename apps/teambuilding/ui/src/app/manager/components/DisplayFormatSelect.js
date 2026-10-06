export default function DisplayFormatSelect({ value, onChange }) {
  return (
    <div>
      <label>Display users as:</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="username">Username</option>
        <option value="email">Email</option>
        <option value="firstName lastName">First Last</option>
        <option value="lastName firstName">Last, First</option>
      </select>
    </div>
  );
}
