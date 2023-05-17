(function () {
    const SCALE = 1

    // @ts-expect-error
    const canvasWidth = Math.max(...imgRowLength) * SCALE
    // @ts-expect-error
    const canvasHeight = imgRowLength.length * SCALE

    const canvas = <HTMLCanvasElement>document.getElementById("canvas")
    canvas.addEventListener('error', () => { })
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    const ctx: CanvasRenderingContext2D = canvas.getContext("2d")

    // @ts-expect-error
    for (let y = 0; y < imgRowLength.length; ++y) {
        // @ts-expect-error
        const rowLength = imgRowLength[y]
        // @ts-expect-error
        const rowStart = imgRowStart[y]
        // @ts-expect-error
        for (let x = 0; x < imgData[y].length; ++x) {
            // @ts-expect-error
            let data = imgData[y][x]
            if (data === 1) {
                ctx.fillStyle = '#087808'
            } else {
                ctx.fillStyle = '#2658b6'
            }
            ctx.fillRect((x + rowStart) * SCALE, y * SCALE, SCALE, SCALE)
            ctx.fill()
        }
    }
}())