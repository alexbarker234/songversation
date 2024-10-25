import { cva, VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  `w-64 p-2 rounded-full transition-transform duration-200 disabled:cursor-default disabled:opacity-50 enabled:hover:scale-105`,
  {
    variants: {
      variant: {
        default: "",
        bordered: "border-2 border-grey-light",
        green: "bg-primary ",
        grey: "bg-grey "
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function Button({ children, onClick, className, disabled, variant }: ButtonProps) {
  return (
    <button onClick={onClick} className={buttonVariants({ variant, className })} disabled={disabled}>
      {children}
    </button>
  );
}
