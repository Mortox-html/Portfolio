// Al pasar el cursor (o el foco del teclado) por un proyecto,
// la sección de proyectos toma los colores de esa web.
(() => {
  'use strict';

  const stage = document.querySelector('.projects');
  const projects = document.querySelectorAll('.project');

  const paint = (project) => {
    stage.style.setProperty('--stage-bg', project.dataset.bg);
    stage.style.setProperty('--stage-fg', project.dataset.fg);
  };

  const reset = () => {
    stage.style.removeProperty('--stage-bg');
    stage.style.removeProperty('--stage-fg');
  };

  projects.forEach((project) => {
    project.addEventListener('mouseenter', () => paint(project));
    project.addEventListener('focusin', () => paint(project));
    project.addEventListener('focusout', reset);
  });
  stage.addEventListener('mouseleave', reset);

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
