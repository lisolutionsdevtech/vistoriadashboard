import { useState, useEffect, useRef, RefObject } from "react";

export function useIntersectionObserver(
  elementRef: RefObject<Element | null>,
  { threshold = 0.1, root = null, rootMargin = "0% 0% 100% 0%" } = {},
) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Uma vez visível, podemos parar de observar se quisermos apenas disparar o carregamento uma vez
          observer.unobserve(element);
        }
      },
      { threshold, root, rootMargin },
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [elementRef, threshold, root, rootMargin]);

  return isVisible;
}
