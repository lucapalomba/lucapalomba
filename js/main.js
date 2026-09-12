// Initializes the hero particles. Kept in its own function so it can be
// deferred to an idle callback: the library is self-hosted (see #83) but
// starting the canvas is still non-urgent at first paint.
function initParticles() {
  if (window.particlesJS) {
    // Detect if on mobile/tablet
    const isMobile = window.innerWidth <= 768;
    const particleCount = isMobile ? 30 : 70;
    const enableHover = !isMobile;

    particlesJS('particles-js', {
      "particles": {
        "number": {
          "value": particleCount,
          "density": {
            "enable": true,
            "value_area": 800
          }
        },
        "color": {
          "value": "#6e48aa"
        },
        "shape": {
          "type": "circle",
          "stroke": {
            "width": 0,
            "color": "#000000"
          },
          "polygon": {
            "nb_sides": 5
          }
        },
        "opacity": {
          "value": 1,
          "random": true,
          "anim": {
            "enable": true,
            "speed": 1,
            "opacity_min": 0,
            "sync": false
          }
        },
        "size": {
          "value": 3,
          "random": true,
          "anim": {
            "enable": false,
            "speed": 4,
            "size_min": 0.3,
            "sync": false
          }
        },
        "move": {
          "enable": true,
          "speed": 2,
          "direction": "none",
          "random": false,
          "straight": false,
          "out_mode": "out",
          "bounce": false,
          "attract": {
            "enable": false,
            "rotateX": 600,
            "rotateY": 600
          }
        }
      },
      "interactivity": {
        "detect_on": "canvas",
        "events": {
          "onhover": {
            "enable": enableHover,
            "mode": "grab"
          },
          "onclick": {
            "enable": enableHover,
            "mode": "repulse"
          },
          "resize": true
        },
        "modes": {
          "grab": {
            "distance": 140,
            "line_linked": {
              "opacity": 1
            }
          },
          "push": {
            "particles_nb": 4
          },
          "repulse": {
            "distance": 200,
            "duration": 0.4
          }
        }
      },
      "retina_detect": true
    });
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // Defer particles until the main thread is idle; fall straight to init when
  // idle callbacks are not supported. A timeout keeps it from starving.
  if ('requestIdleCallback' in window) {
    requestIdleCallback(initParticles, { timeout: 2000 });
  } else {
    initParticles();
  }

  // Entry fade-in is a pure CSS animation (body-fade-in in main.css) — no JS
  // opacity juggling, so it can never leave the page stuck hidden.

  // Hide loader overlay if present
  const overlay = document.querySelector('.transition-overlay');
  if (overlay) {
    overlay.classList.add('finished');
  }
});
