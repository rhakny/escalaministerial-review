import { cn } from "@/lib/utils";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: "h-24", // Aumentado em 200%
  md: "h-32", // Aumentado em 200%
  lg: "h-48", // Aumentado em 200%
};

const Logo = ({ size = 'md', className }: LogoProps) => {
  return (
    <div className={cn("flex items-center", className)}>
      <img
        src="/logo.png"
        alt="Escala Ministerial Logo"
        className={cn(sizeClasses[size], "w-auto")}
      />
    </div>
  );
};

export default Logo;
