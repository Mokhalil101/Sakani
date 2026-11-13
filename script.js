
(() => {
  const frameCount = 240;
  const canvas = document.getElementById("hero-canvas");
  const ctx = canvas?.getContext("2d", { alpha: false });

  if (!canvas || !ctx) return;

  const images = new Array(frameCount);
  const imageSeq = { frame: 0 };

  let loaded = 0;
  let interactionsStarted = false;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const loader = document.getElementById("loader");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  const domImages = [
    ...document.querySelectorAll(".card-img")
  ];

  const totalItems = frameCount + domImages.length;

  const framePath = index =>
    `./frames/ezgif-frame-${String(index).padStart(3, "0")}.jpg`;

  // Canvas sizing
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);

    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    render();
  }

  // Render current frame
  function render() {
    const target = Math.max(
      0,
      Math.min(frameCount - 1, Math.round(imageSeq.frame))
    );

    let img = images[target];

    if (!img?.complete || !img.naturalWidth) {
      for (let distance = 1; distance < frameCount; distance++) {
        const before = images[Math.max(0, target - distance)];
        const after = images[Math.min(frameCount - 1, target + distance)];

        if (before?.complete && before.naturalWidth) {
          img = before;
          break;
        }

        if (after?.complete && after.naturalWidth) {
          img = after;
          break;
        }
      }
    }

    if (!img?.naturalWidth) return;

    const cw = canvas.width;
    const ch = canvas.height;

    const scale = Math.max(
      cw / img.naturalWidth,
      ch / img.naturalHeight
    );

    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;

    ctx.fillStyle = "#111a22";
    ctx.fillRect(0, 0, cw, ch);

    ctx.drawImage(
      img,
      (cw - w) / 2,
      (ch - h) / 2,
      w,
      h
    );
  }

  // Loading progress
  function updateProgress() {
    loaded++;

    const pct = Math.min(
      100,
      Math.round((loaded / totalItems) * 100)
    );

    if (progressBar) {
      progressBar.style.width = `${pct}%`;
    }

    if (progressText) {
      progressText.textContent =
        `Preparing your experience · ${pct}%`;
    }
  }

  // Finish loading
  function finishLoading() {
    if (interactionsStarted) return;

    interactionsStarted = true;
    render();

    if (window.gsap) {
      gsap.to(loader, {
        autoAlpha: 0,
        duration: 0.8,
        onComplete: initInteractions
      });
    } else {
      loader?.remove();
      initInteractions();
    }
  }

  // Lazy load property images
  domImages.forEach(img => {
    img.loading = "lazy";
    img.decoding = "async";

    if (img.complete) {
      updateProgress();
    } else {
      img.addEventListener("load", updateProgress, {
        once: true
      });

      img.addEventListener("error", updateProgress, {
        once: true
      });
    }
  });

  // Load architectural frames
  function loadFrame(index, onFirst = false) {
    if (
      index < 0 ||
      index >= frameCount ||
      images[index]
    ) {
      return;
    }

    const img = new Image();

    img.decoding = "async";
    img.src = framePath(index + 1);

    images[index] = img;

    const done = () => {
      updateProgress();

      if (onFirst) {
        finishLoading();
      }

      if (
        Math.abs(index - Math.round(imageSeq.frame)) <= 2
      ) {
        render();
      }
    };

    if (img.decode) {
      img.decode().then(done).catch(done);
    } else {
      img.onload = done;
      img.onerror = done;
    }
  }

  // Prioritize first frame
  loadFrame(0, true);

  // Load remaining frames
  for (let i = 1; i < frameCount; i++) {
    loadFrame(i);
  }

  // GSAP interactions
  function initInteractions() {
    render();

    const gsapReady =
      window.gsap && window.ScrollTrigger;

    if (!gsapReady) {
      document.querySelectorAll(".card").forEach(card => {
        card.style.opacity = "1";
      });

      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    gsap.set("#phase1", {
      opacity: 1
    });

    gsap.fromTo(
      ".phase1-ui",
      {
        opacity: 0,
        y: 24
      },
      {
        opacity: 1,
        y: 0,
        duration: 1.15,
        stagger: 0.1,
        ease: "power2.out"
      }
    );

    if (!reducedMotion) {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: "#hero-container",
          pin: true,
          start: "top top",
          end: "+=300%",
          scrub: 1.25
        }
      });

      timeline.to(
        "#hero-overlay",
        {
          opacity: 0,
          duration: 60
        },
        0
      );

      timeline.fromTo(
        "#scroll-indicator",
        {
          opacity: 1
        },
        {
          opacity: 0,
          duration: 15,
          immediateRender: false
        },
        0
      );

      timeline.fromTo(
        "#hero-heading, #hero-subtext, #hero-stats, #hero-buttons",
        {
          opacity: 1
        },
        {
          opacity: 0,
          duration: 40,
          immediateRender: false
        },
        0
      );

      timeline.to(
        imageSeq,
        {
          frame: frameCount - 1,
          snap: "frame",
          ease: "none",
          duration: frameCount - 1,

          onUpdate: () => {
            const frame = Math.round(imageSeq.frame);

            if (!images[frame]) {
              loadFrame(frame);
            }

            render();
          }
        },
        60
      );

      timeline.to(
        "#hero-overlay",
        {
          opacity: 1,
          duration: 40
        },
        220
      );

      timeline.to(
        "#phase3",
        {
          opacity: 1,
          duration: 40
        },
        220
      );

      timeline.to(
        ".phase3-line",
        {
          width: "200px",
          duration: 40
        },
        220
      );

      gsap.to(".left-text", {
        xPercent: -10,
        ease: "none",

        scrollTrigger: {
          trigger: "#statement",
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5
        }
      });

      gsap.to(".right-text", {
        xPercent: 10,
        ease: "none",

        scrollTrigger: {
          trigger: "#statement",
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5
        }
      });

      gsap.to(".line-left, .line-right", {
        width: "35%",
        ease: "power2.out",

        scrollTrigger: {
          trigger: "#statement",
          start: "20% bottom",
          end: "center center",
          scrub: 1.5
        }
      });
    }

    // Cards reveal animation
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            gsap.to(entry.target, {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: "power2.out"
            });

            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08
      }
    );

    document.querySelectorAll(".card").forEach(card => {
      observer.observe(card);
    });
  }

  // Resize
  window.addEventListener("resize", resizeCanvas, {
    passive: true
  });

  resizeCanvas();

  // Responsive navigation
  const nav = document.querySelector("nav");
  const menuToggle = document.querySelector(".menu-toggle");

  menuToggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("menu-open");

    menuToggle.setAttribute(
      "aria-expanded",
      String(open)
    );

    menuToggle.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation"
    );
  });

  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("menu-open");

      menuToggle?.setAttribute(
        "aria-expanded",
        "false"
      );
    });
  });

  // Navbar scroll effect
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
      start: "top -50",
      end: 99999,

      toggleClass: {
        className: "scrolled",
        targets: "nav"
      }
    });
  } else {
    window.addEventListener(
      "scroll",
      () => {
        nav?.classList.toggle(
          "scrolled",
          window.scrollY > 50
        );
      },
      {
        passive: true
      }
    );
  }

  // Contact form
  document
    .getElementById("inquiry-form")
    ?.addEventListener("submit", event => {
      event.preventDefault();

      const data = new FormData(event.currentTarget);

      const subject = encodeURIComponent(
        "SAKANI property inquiry"
      );

      const body = encodeURIComponent(
        `Name: ${data.get("name")}\n` +
        `Email: ${data.get("email")}\n` +
        `Interest: ${data.get("interest") || "Not specified"}`
      );

      window.location.href =
        `mailto:SAKANI@gmail.com?subject=${subject}&body=${body}`;
    });

  // Footer year
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

})();
