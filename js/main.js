document.addEventListener('DOMContentLoaded', function () {
  // Initialize Particles.js
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
          },
          "image": {
            "src": "img/github.svg",
            "width": 100,
            "height": 100
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
        "line_linked": {
          "enable": false,
          "distance": 150,
          "color": "#9d50bb",
          "opacity": 0.4,
          "width": 1
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

  // Show content after a delay (Fade in)
  setTimeout(function () {
    document.body.style.opacity = '1';
  }, 300);

  // Hide loader overlay if present
  const overlay = document.querySelector('.transition-overlay');
  if (overlay) {
    overlay.classList.add('finished');
  }
});
