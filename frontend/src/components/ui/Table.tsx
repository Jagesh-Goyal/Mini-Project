interface TableProps {
  columns: string[];
  rows: Record<string, any>[];
  className?: string;
}

export default function Table({ columns, rows, className = '' }: TableProps) {
  return (
    <div className={`table-wrapper ${className}`}>
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => (
                <td key={`${idx}-${col}`}>
                  {String(row[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
