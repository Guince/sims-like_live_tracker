document.addEventListener('DOMContentLoaded', () => {
    const sliders = document.querySelectorAll('.life-area-slider');

    // --- Wheel Update Logic ---

    const wheelConfig = {
        centerX: 150,
        centerY: 150,
        outerRadius: 130,
        sectorAngle: 45, // 360 / 8
    };

    function polarToCartesian(radius, angleInDegrees) {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: wheelConfig.centerX + (radius * Math.cos(angleInRadians)),
            y: wheelConfig.centerY + (radius * Math.sin(angleInRadians)),
        };
    }

    function describeSector(sectorIndex, value) {
        const valueRadius = (value / 10) * wheelConfig.outerRadius;
        const startAngle = sectorIndex * wheelConfig.sectorAngle;
        const endAngle = startAngle + wheelConfig.sectorAngle;

        const p1_inner = polarToCartesian(valueRadius, startAngle);
        const p2_inner = polarToCartesian(valueRadius, endAngle);
        const p1_outer = polarToCartesian(wheelConfig.outerRadius, startAngle);
        const p2_outer = polarToCartesian(wheelConfig.outerRadius, endAngle);

        const largeArcFlag = wheelConfig.sectorAngle <= 180 ? "0" : "1";

        const brightD = (value > 0) ? [
            "M", wheelConfig.centerX, wheelConfig.centerY,
            "L", p1_inner.x, p1_inner.y,
            "A", valueRadius, valueRadius, 0, largeArcFlag, 1, p2_inner.x, p2_inner.y,
            "Z"
        ].join(" ") : "";

        const paleD = (value < 10) ? [
            "M", p1_inner.x, p1_inner.y,
            "L", p1_outer.x, p1_outer.y,
            "A", wheelConfig.outerRadius, wheelConfig.outerRadius, 0, largeArcFlag, 1, p2_outer.x, p2_outer.y,
            "L", p2_inner.x, p2_inner.y,
            "A", valueRadius, valueRadius, 0, largeArcFlag, 0, p1_inner.x, p1_inner.y,
            "Z"
        ].join(" ") : "";

        return { brightD, paleD };
    }

    function updateWheelSector(index, value) {
        const sectorGroup = document.querySelector(`[data-sector-id="${index}"]`);
        if (!sectorGroup) return;

        const brightPath = sectorGroup.querySelector('.sector-bright');
        const palePath = sectorGroup.querySelector('.sector-pale');
        const valueText = document.querySelector(`.wheel-values [data-value-id="${index}"]`);

        const paths = describeSector(index, value);
        
        brightPath.setAttribute('d', paths.brightD);
        palePath.setAttribute('d', paths.paleD);
        
        if (valueText) {
            valueText.textContent = value;
        }
    }

    // --- Event Listeners ---
    sliders.forEach((slider, index) => {
        const valueSpan = slider.nextElementSibling;

        // Initial update on page load
        updateWheelSector(index, slider.value);

        slider.addEventListener('input', (event) => {
            const value = event.target.value;
            valueSpan.textContent = value;
            updateWheelSector(index, value);
        });
    });
}); 