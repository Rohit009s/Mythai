import React from "react";
import { motion } from "framer-motion";

// Simple utility function to combine class names
const cn = (...classes) => classes.filter(Boolean).join(' ');

// Simple Button component to replace the deleted one
const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "h-10 py-2 px-4",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})

export function AnimatedBorderButton({ 
  children, 
  className, 
  variant = "outline", 
  size = "default",
  icon: IconComponent,
  animationDuration = 3,
  gradientColors = "from-blue-500 via-purple-500 to-pink-500",
  ...props 
}) {
  return (
    <Button 
      variant={variant} 
      size={size}
      className={cn("relative overflow-hidden", className)} 
      {...props}
    >
      {/* Animated Border */}
      <div
        className={cn(
          "-inset-px pointer-events-none absolute rounded-[inherit] border-2 border-transparent",
          "[mask-clip:padding-box,border-box] [mask-composite:intersect]",
          "[mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
        )}
      >
        <motion.div
          className={cn(
            "absolute aspect-square bg-gradient-to-r",
            gradientColors
          )}
          animate={{
            offsetDistance: ["0%", "100%"],
          }}
          style={{
            width: 20,
            offsetPath: `rect(0 auto auto 0 round 8px)`,
          }}
          transition={{
            repeat: Infinity,
            duration: animationDuration,
            ease: "linear",
          }}
        />
      </div>
      
      {/* Button Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {IconComponent && <IconComponent className="w-4 h-4" />}
        {children}
      </span>
    </Button>
  );
}

// Preset variants for different button types
export function ChatAnimatedButton({ children, ...props }) {
  return (
    <AnimatedBorderButton
      gradientColors="from-blue-400 via-cyan-500 to-blue-600"
      animationDuration={2.5}
      {...props}
    >
      {children}
    </AnimatedBorderButton>
  );
}

export function CallAnimatedButton({ children, ...props }) {
  return (
    <AnimatedBorderButton
      gradientColors="from-green-400 via-emerald-500 to-green-600"
      animationDuration={2}
      {...props}
    >
      {children}
    </AnimatedBorderButton>
  );
}

export function VoiceAnimatedButton({ children, ...props }) {
  return (
    <AnimatedBorderButton
      gradientColors="from-purple-400 via-violet-500 to-purple-600"
      animationDuration={3}
      {...props}
    >
      {children}
    </AnimatedBorderButton>
  );
}