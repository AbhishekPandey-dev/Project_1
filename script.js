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

// macOS Window Logic
const notesIcon = document.getElementById('notes-app-icon');
const calculatorIcon = document.getElementById('calculator-app-icon');
const macWindow = document.getElementById('mac-window');
const closeBtn = document.getElementById('mac-close');
const maximizeBtn = document.getElementById('mac-maximize');
const titleBar = document.getElementById('mac-titlebar');
const macIframe = document.getElementById('mac-iframe');
const macTitle = document.querySelector('.mac-title');

function openMacWindow(title, src) {
  if (macTitle) macTitle.textContent = title;
  if (macIframe) macIframe.src = src;
  macWindow.classList.add('active');
}

if (macWindow) {
  // Open window with animation
  if (notesIcon) {
    notesIcon.addEventListener('click', () => openMacWindow('Pages', 'assets/componets/pages.html'));
  }
  if (calculatorIcon) {
    calculatorIcon.addEventListener('click', () => openMacWindow('Calculator', 'assets/componets/calculator.html'));
  }

  // Close window
  closeBtn.addEventListener('click', () => {
    macWindow.classList.remove('active');
    setTimeout(() => {
      macWindow.classList.remove('maximized');
    }, 300);
  });

  // Maximize window
  maximizeBtn.addEventListener('click', () => {
    macWindow.classList.toggle('maximized');
  });

  // Window Dragging Logic
  let isDragging = false;
  let offsetX, offsetY;
  
  titleBar.addEventListener('mousedown', (e) => {
    if (macWindow.classList.contains('maximized') || e.target.closest('.mac-traffic-lights')) return;
    
    isDragging = true;
    const rect = macWindow.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    // Disable smooth transition while dragging
    macWindow.style.transition = 'none';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    macWindow.style.left = (e.clientX - offsetX) + 'px';
    macWindow.style.top = (e.clientY - offsetY) + 'px';
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      // Restore smooth transition after dragging
      macWindow.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease';
    }
  });
}