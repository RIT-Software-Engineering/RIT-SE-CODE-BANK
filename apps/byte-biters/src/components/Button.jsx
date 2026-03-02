import clsx from 'clsx'; // Utility for conditionally joining class names

//styling for buttons! 
const Button = ({ children, variant, ...props }) => {
  const baseStyles = 'px-4 py-2 rounded font-medium transition duration-150 ease-in-out';

  const variantStyles = {
    primary: 'bg-button-default text-button-text rounded-full hover:bg-button-hover',
  };

  return (
    <button className={clsx(baseStyles, variantStyles[variant])} {...props}>
      {children}
    </button>
  );
};
export default Button;
