//header clock
function showTime() {
  const date = new Date();

  let h = date.getHours();
  let m = date.getMinutes();
  let s = date.getSeconds();

  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h === 0 ? 12 : h;

  h = h < 10 ? "0" + h : h;
  m = m < 10 ? "0" + m : m;
  s = s < 10 ? "0" + s : s;

  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  document.getElementById("live-clock").innerHTML = `${h}:${m}:${s}`;
  document.getElementById("day").innerHTML = days[date.getDay()];
  document.getElementById("date").innerHTML =
    `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;

  setTimeout(showTime, 1000);
}
showTime();

const preloader = document.getElementById("preloader");
const mainContent = document.getElementById("main-content");

function hidePreloader() {
  if (!preloader || preloader.dataset.dismissed === "true") return;

  preloader.dataset.dismissed = "true";
  preloader.classList.add("fade-out");

  if (mainContent) {
    mainContent.classList.add("fade-in");
  }

  setTimeout(() => {
    preloader.style.display = "none";
  }, 1000);
}

// Fallback so the page still opens even if the background module stalls.
window.addEventListener("load", () => {
  setTimeout(hidePreloader, 600);
});

setTimeout(hidePreloader, 4000);

document.addEventListener("mousemove", (e) => {
  const x = e.clientX;
  const y = e.clientY;

  document.documentElement.style.setProperty("--mouse-x", x + "px");
  document.documentElement.style.setProperty("--mouse-y", y + "px");
});


// footer dock 
import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.12.2/+esm";
console.clear();

let icons = document.querySelectorAll(".dockitems");
let dock = document.querySelector(".dockbar");
let firstIcon = icons[0];

let min = 48; // 40 + margin
let max = 120;
let bound = min * Math.PI;

gsap.set(icons, {
  transformOrigin: "50% 120%",
  height: 40,
});

gsap.set(dock, {
  position: "relative",
  height: 60,
});

dock.addEventListener("mousemove", (event) => {
  let offset = dock.getBoundingClientRect().left + firstIcon.offsetLeft;
  updateIcons(event.clientX - offset);
});

dock.addEventListener("mouseleave", (event) => {
  gsap.to(icons, {
    duration: 0.3,
    scale: 1,
    x: 0,
  });
});

function updateIcons(pointer) {
  for (let i = 0; i < icons.length; i++) {
    let icon = icons[i];
    let distance = i * min + min / 2 - pointer;
    let x = 0;
    let scale = 1;

    if (-bound < distance && distance < bound) {
      let rad = (distance / min) * 0.5;
      scale = 1 + (max / min - 1) * Math.cos(rad);
      x = 2 * (max - min) * Math.sin(rad);
    } else {
      x = (-bound < distance ? 2 : -2) * (max - min);
    }

    gsap.to(icon, {
      duration: 0.3,
      x: x,
      scale: scale,
    });
  }
}

// macOS Window Manager — App Icon Bindings
// Each click spawns a new independent window (multiple windows supported)

const notesIcon = document.getElementById('notes-app-icon');
const calculatorIcon = document.getElementById('calculator-app-icon');
const converterIcon = document.getElementById('converter-app-icon');
const toolsIcon = document.getElementById('tools-app-icon');

if (notesIcon) {
  notesIcon.addEventListener('click', () => WindowManager.open('pages'));
}
if (calculatorIcon) {
  calculatorIcon.addEventListener('click', () => WindowManager.open('calculator'));
}
if (converterIcon) {
  converterIcon.addEventListener('click', () => WindowManager.open('converter'));
}
if (toolsIcon) {
  toolsIcon.addEventListener('click', () => WindowManager.open('tools'));
}

// DevDocs Dock bindings
document.querySelectorAll('.dockbar .dockitems').forEach(item => {
  const labelEl = item.querySelector('.dockitemlabel');
  const linkEl = item.querySelector('.dockitemlink');
  const imgEl = item.querySelector('.dockitemicon');
  
  if (labelEl && linkEl && imgEl) {
    const title = labelEl.textContent.trim();
    // Exclude 'Google' as it's not a dev doc
    if (title === 'Google') return;

    // Use a clean app ID
    const appName = `devdocs-${title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const iconPath = imgEl.getAttribute('src');
    
    // Register dynamically in WindowManager
    if (window.WindowManager) {
      window.WindowManager.registerApp(appName, {
        title: title + ' Docs',
        src: `assets/componets/devdocs.html?lang=${encodeURIComponent(title)}`,
        icon: iconPath,
        defaultWidth: 1200,
        defaultHeight: 750
      });

      // Add click event
      linkEl.addEventListener('click', (e) => {
        e.preventDefault();
        window.WindowManager.open(appName);
      });
    }
  }
});
