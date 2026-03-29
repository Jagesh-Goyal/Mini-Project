export default function Button({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`btn bg-primary text-white hover:bg-indigo-600 ${className}`}>
      {children}
    </button>
  );
}
