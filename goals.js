document.addEventListener('DOMContentLoaded', () => {
    const sliders = document.querySelectorAll('.life-area-slider');

    sliders.forEach(slider => {
        const valueSpan = slider.nextElementSibling;

        slider.addEventListener('input', (event) => {
            valueSpan.textContent = event.target.value;
        });
    });
}); 