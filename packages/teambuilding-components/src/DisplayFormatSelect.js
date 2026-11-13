import './styles/DisplayFormatSelect.css';
export default function DisplayFormatSelect({ value, onChange }) {
  return (
    <div className="display-format">
      <label className="display-format-label" htmlFor="display-format-select">Display users as:</label>
      <select id="display-format-select" className="display-format-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="username">Username</option>
        <option value="email">Email</option>
        <option value="firstName lastName">First Last</option>
        <option value="lastName firstName">Last, First</option>
      </select>
    </div>
  );
}