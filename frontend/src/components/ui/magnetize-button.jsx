import * as React from "react"
import { motion, useAnimation } from "framer-motion"
import { Magnet } from "lucide-react"
import { useEffect, useState, useCallback } from "react"

// Simple utility function to combine class names
const cn = (...classes) => classes.filter(Boolean).join(' ')

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

function MagnetizeButton({
  className,
  children,
  particleCount = 12,
  attractRadius = 50,
  variant = "default",
  isActive = false,
  icon: IconComponent,
  ...props
}) {
  const [isAttracting, setIsAttracting] = useState(false)
  const [particles, setParticles] = useState([])
  const particlesControl = useAnimation()

  useEffect(() => {
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 360 - 180,
      y: Math.random() * 360 - 180,
    }))
    setParticles(newParticles)
  }, [particleCount])

  const handleInteractionStart = useCallback(async () => {
    setIsAttracting(true)
    await particlesControl.start({
      x: 0,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 50,
        damping: 10,
      },
    })
  }, [particlesControl])

  const handleInteractionEnd = useCallback(async () => {
    setIsAttracting(false)
    await particlesControl.start((i) => ({
      x: particles[i]?.x || 0,
      y: particles[i]?.y || 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    }))
  }, [particlesControl, particles])

  // Auto-attract when active (for "on air" state)
  useEffect(() => {
    if (isActive) {
      handleInteractionStart()
    } else {
      handleInteractionEnd()
    }
  }, [isActive, handleInteractionStart, handleInteractionEnd])

  const getVariantStyles = () => {
    switch (variant) {
      case "call":
        return {
          base: "bg-green-100/20 dark:bg-green-900/20 hover:bg-green-200/30 dark:hover:bg-green-800/30 text-green-600 dark:text-green-300 border border-green-300/50 dark:border-green-700/50",
          particles: "bg-green-400 dark:bg-green-300",
          activeBase: "bg-green-200/40 dark:bg-green-800/40 border-green-400/70 dark:border-green-600/70"
        }
      case "chat":
        return {
          base: "bg-blue-100/20 dark:bg-blue-900/20 hover:bg-blue-200/30 dark:hover:bg-blue-800/30 text-blue-600 dark:text-blue-300 border border-blue-300/50 dark:border-blue-700/50",
          particles: "bg-blue-400 dark:bg-blue-300",
          activeBase: "bg-blue-200/40 dark:blue-800/40 border-blue-400/70 dark:border-blue-600/70"
        }
      case "voice":
        return {
          base: "bg-purple-100/20 dark:bg-purple-900/20 hover:bg-purple-200/30 dark:hover:bg-purple-800/30 text-purple-600 dark:text-purple-300 border border-purple-300/50 dark:border-purple-700/50",
          particles: "bg-purple-400 dark:bg-purple-300",
          activeBase: "bg-purple-200/40 dark:bg-purple-800/40 border-purple-400/70 dark:border-purple-600/70"
        }
      default:
        return {
          base: "bg-violet-100 dark:bg-violet-900 hover:bg-violet-200 dark:hover:bg-violet-800 text-violet-600 dark:text-violet-300 border border-violet-300 dark:border-violet-700",
          particles: "bg-violet-400 dark:bg-violet-300",
          activeBase: "bg-violet-200 dark:bg-violet-800 border-violet-400 dark:border-violet-600"
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <Button
      className={cn(
        "min-w-40 relative touch-none backdrop-blur-lg transition-all duration-300",
        styles.base,
        isActive && styles.activeBase,
        className
      )}
      onMouseEnter={!isActive ? handleInteractionStart : undefined}
      onMouseLeave={!isActive ? handleInteractionEnd : undefined}
      onTouchStart={!isActive ? handleInteractionStart : undefined}
      onTouchEnd={!isActive ? handleInteractionEnd : undefined}
      {...props}
    >
      {particles.map((_, index) => (
        <motion.div
          key={index}
          custom={index}
          initial={{ x: particles[index]?.x || 0, y: particles[index]?.y || 0 }}
          animate={particlesControl}
          className={cn(
            "absolute w-1.5 h-1.5 rounded-full transition-opacity duration-300",
            styles.particles,
            (isAttracting || isActive) ? "opacity-100" : "opacity-40"
          )}
        />
      ))}
      <span className="relative w-full flex items-center justify-center gap-2">
        {IconComponent ? (
          <IconComponent
            className={cn(
              "w-4 h-4 transition-transform duration-300",
              (isAttracting || isActive) && "scale-110"
            )}
          />
        ) : (
          <Magnet
            className={cn(
              "w-4 h-4 transition-transform duration-300",
              (isAttracting || isActive) && "scale-110"
            )}
          />
        )}
        {children || (isAttracting || isActive ? "Attracting" : "Hover me")}
      </span>
    </Button>
  )
}

export { MagnetizeButton }