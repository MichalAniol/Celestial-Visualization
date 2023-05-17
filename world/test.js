(function () {
    const SCALE = 1;
    const canvasWidth = Math.max(...imgRowLength) * SCALE;
    const canvasHeight = imgRowLength.length * SCALE;
    const canvas = document.getElementById("canvas");
    canvas.addEventListener('error', () => { });
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    for (let y = 0; y < imgRowLength.length; ++y) {
        const rowLength = imgRowLength[y];
        const rowStart = imgRowStart[y];
        for (let x = 0; x < imgData[y].length; ++x) {
            let data = imgData[y][x];
            if (data === 1) {
                ctx.fillStyle = '#087808';
            }
            else {
                ctx.fillStyle = '#2658b6';
            }
            ctx.fillRect((x + rowStart) * SCALE, y * SCALE, SCALE, SCALE);
            ctx.fill();
        }
    }
}());
