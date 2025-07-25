import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  revealed: boolean;
  revealRadius: number;
}

interface Connection {
  from: number;
  to: number;
  opacity: number;
}

export default function NeuralNetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize nodes - increased density for better mouse interaction
    const nodeCount = window.innerWidth < 768 ? 120 : Math.min(250, Math.floor(window.innerWidth * window.innerHeight / 5000));
    const nodes: Node[] = [];
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        revealed: false,
        revealRadius: 0
      });
    }

    // Create maximum messy connections
    const connections: Connection[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = Math.sqrt(
          Math.pow(nodes[i].x - nodes[j].x, 2) +
          Math.pow(nodes[i].y - nodes[j].y, 2)
        );
        
        if (distance < 200 && Math.random() < 0.9) {
          connections.push({
            from: i,
            to: j,
            opacity: 0
          });
        }
      }
    }

    nodesRef.current = nodes;
    connectionsRef.current = connections;

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY
      };
    };

    document.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const nodes = nodesRef.current;
      const connections = connectionsRef.current;
      
      // Update and draw nodes
      nodes.forEach((node) => {
        // Move nodes slightly
        node.x += node.vx;
        node.y += node.vy;
        
        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
        
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));

        // Check if mouse is near
        const distance = Math.sqrt(
          Math.pow(node.x - mouseRef.current.x, 2) +
          Math.pow(node.y - mouseRef.current.y, 2)
        );
        
        const targetRadius = distance < 100 ? Math.max(0, 100 - distance) : 0;
        node.revealRadius += (targetRadius - node.revealRadius) * 0.1;
        
        // Draw node
        if (node.revealRadius > 2) {
          // Draw glow effect
          const gradient = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, 30
          );
          gradient.addColorStop(0, `rgba(59, 130, 246, ${node.revealRadius / 100 * 0.4})`);
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
          
          ctx.beginPath();
          ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
          
          // Draw node center
          ctx.beginPath();
          ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59, 130, 246, ${node.revealRadius / 100})`;
          ctx.fill();
        }
      });

      // Update and draw connections
      connections.forEach(conn => {
        const fromNode = nodes[conn.from];
        const toNode = nodes[conn.to];
        
        const targetOpacity = (fromNode.revealRadius > 10 || toNode.revealRadius > 10) ? 
          Math.min(fromNode.revealRadius, toNode.revealRadius) / 100 : 0;
        
        conn.opacity += (targetOpacity - conn.opacity) * 0.1;
        
        if (conn.opacity > 0.05) {
          // Draw connection line
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.strokeStyle = `rgba(59, 130, 246, ${conn.opacity * 0.8})`;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw animated pulse
          const progress = (Date.now() / 1500) % 1;
          const pulseX = fromNode.x + (toNode.x - fromNode.x) * progress;
          const pulseY = fromNode.y + (toNode.y - fromNode.y) * progress;
          
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59, 130, 246, ${conn.opacity * 0.8})`;
          ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="neural-network-canvas"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        zIndex: 1,
        pointerEvents: 'none'
      }}
    />
  );
}