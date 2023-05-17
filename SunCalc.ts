/*
 (c) 2011-2015, Vladimir Agafonkin
 SunCalc is a JavaScript library for calculating sun/moon position and light phases.
 https://github.com/mourner/suncalc
*/

const SunCalc = (function () {
    'use strict'

    // shortcuts for easier to read formulas

    const PI = Math.PI,
        sin = Math.sin,
        cos = Math.cos,
        tan = Math.tan,
        asin = Math.asin,
        atan = Math.atan2,
        acos = Math.acos,
        rad = PI / 180;

    // sun calculations are based on http://aa.quae.nl/en/reken/zonpositie.html formulas


    // date/time constants and conversions

    const dayMs = 1000 * 60 * 60 * 24,
        J1970 = 2440588,
        J2000 = 2451545

    const toJulian = (date: Date) => { return date.valueOf() / dayMs - 0.5 + J1970 }
    const fromJulian = (j: number) => { return new Date((j + 0.5 - J1970) * dayMs); }
    const toDays = (date: Date) => { return toJulian(date) - J2000 }


    // general calculations for position

    const e = rad * 23.4397 // obliquity of the Earth

    const rightAscension = (l: number, b: number) => { return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l)) }
    const declination = (l: number, b: number) => { return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l)) }

    const azimuth = (H: number, phi: number, dec: number) => { return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi)) }
    const altitude = (H: number, phi: number, dec: number) => { return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H)) }

    const siderealTime = (d: number, lw: number) => { return rad * (280.16 + 360.9856235 * d) - lw }

    const astroRefraction = (h: number) => {
        if (h < 0) // the following formula works for positive altitudes only.
            h = 0; // if h = -0.08901179 a div/0 would occur.

        // formula 16.4 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
        // 1.02 / tan(h + 10.26 / (h + 5.10)) h in degrees, result in arc minutes -> converted to rad:
        return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
    }

    // general sun calculations

    const solarMeanAnomaly = (d: number) => { return rad * (357.5291 + 0.98560028 * d) }

    const eclipticLongitude = (M: number) => {

        const C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)), // equation of center
            P = rad * 102.9372 // perihelion of the Earth

        return M + C + P + PI
    }

    const sunCoords = (d: number) => {

        const M = solarMeanAnomaly(d),
            L = eclipticLongitude(M)

        return {
            dec: declination(L, 0),
            ra: rightAscension(L, 0)
        };
    }


    // calculates sun position for a given date and latitude/longitude

    const getPosition = (date: Date, lat: number, lng: number) => {

        const lw = rad * -lng,
            phi = rad * lat,
            d = toDays(date),

            c = sunCoords(d),
            H = siderealTime(d, lw) - c.ra

        return {
            azimuth: azimuth(H, phi, c.dec),
            altitude: altitude(H, phi, c.dec)
        }
    }



    // sun times configuration (angle, morning name, evening name)

    const times: [number, string, string][] = [
        [-0.833, 'sunrise', 'sunset'],
        [-0.3, 'sunriseEnd', 'sunsetStart'],
        [-6, 'dawn', 'dusk'],
        [-12, 'nauticalDawn', 'nauticalDusk'],
        [-18, 'nightEnd', 'night'],
        [6, 'goldenHourEnd', 'goldenHour']
    ];

    // adds a custom time to the times config

    const addTime = function (angle: number, riseName: string, setName: string) {
        times.push([angle, riseName, setName]);
    };


    // calculations for sun times

    const J0 = 0.0009;

    const julianCycle = (d: number, lw: number) => { return Math.round(d - J0 - lw / (2 * PI)); }

    const approxTransit = (Ht: number, lw: number, n: number) => { return J0 + (Ht + lw) / (2 * PI) + n; }
    const solarTransitJ = (ds: number, M: number, L: number) => { return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L); }

    const hourAngle = (h: number, phi: number, d: number) => { return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d))); }
    const observerAngle = (height: number) => { return -2.076 * Math.sqrt(height) / 60; }

    // returns set time for the given sun altitude
    const getSetJ = (h: number, lw: number, phi: number, dec: number, n: number, M: number, L: number) => {

        const w = hourAngle(h, phi, dec),
            a = approxTransit(w, lw, n);
        return solarTransitJ(a, M, L);
    }


    // calculates sun times for a given date, latitude/longitude, and, optionally,
    // the observer height (in meters) relative to the horizon

    const getTimes = (date: Date, lat: number, lng: number, height: number) => {

        height = height || 0;

        const lw = rad * -lng,
            phi = rad * lat,

            dh = observerAngle(height),

            d = toDays(date),
            n = julianCycle(d, lw),
            ds = approxTransit(0, lw, n),

            M = solarMeanAnomaly(ds),
            L = eclipticLongitude(M),
            dec = declination(L, 0),

            Jnoon = solarTransitJ(ds, M, L)

        let i, len, time, h0, Jset, Jrise;


        const result: any = {
            solarNoon: fromJulian(Jnoon),
            nadir: fromJulian(Jnoon - 0.5)
        };

        for (i = 0, len = times.length; i < len; i += 1) {
            time = times[i]
            h0 = (time[0] + dh) * rad

            Jset = getSetJ(h0, lw, phi, dec, n, M, L)
            Jrise = Jnoon - (Jset - Jnoon)

            result[time[1]] = fromJulian(Jrise)
            result[time[2]] = fromJulian(Jset)
        }

        return result
    };


    // moon calculations, based on http://aa.quae.nl/en/reken/hemelpositie.html formulas

    const moonCoords = (d: number) => { // geocentric ecliptic coordinates of the moon

        var L = rad * (218.316 + 13.176396 * d), // ecliptic longitude
            M = rad * (134.963 + 13.064993 * d), // mean anomaly
            F = rad * (93.272 + 13.229350 * d),  // mean distance

            l = L + rad * 6.289 * sin(M), // longitude
            b = rad * 5.128 * sin(F),     // latitude
            dt = 385001 - 20905 * cos(M)  // distance to the moon in km

        return {
            ra: rightAscension(l, b),
            dec: declination(l, b),
            dist: dt
        };
    }

    const getMoonPosition = (date: Date, lat: number, lng: number) => {

        const lw = rad * -lng,
            phi = rad * lat,
            d = toDays(date),

            c = moonCoords(d),
            H = siderealTime(d, lw) - c.ra,
            // formula 14.1 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
            pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H))

        let h = altitude(H, phi, c.dec)

        h = h + astroRefraction(h); // altitude correction for refraction

        return {
            azimuth: azimuth(H, phi, c.dec),
            altitude: h,
            distance: c.dist,
            parallacticAngle: pa
        };
    };


    // calculations for illumination parameters of the moon,
    // based on http://idlastro.gsfc.nasa.gov/ftp/pro/astro/mphase.pro formulas and
    // Chapter 48 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.

    const getMoonIllumination = (date: Date) => {

        const d = toDays(date || new Date()),
            s = sunCoords(d),
            m = moonCoords(d),

            sdist = 149598000, // distance from Earth to Sun in km

            phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra)),
            inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi)),
            angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) -
                cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra))

        return {
            fraction: (1 + cos(inc)) / 2,
            phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
            angle: angle
        }
    }


    const hoursLater = (date: Date, h: number) => {
        return new Date(date.valueOf() + h * dayMs / 24)
    }

    // calculations for moon rise/set times are based on http://www.stargazing.net/kepler/moonrise.html article

    const getMoonTimes = function (date: Date, lat: number, lng: number, inUTC: boolean) {
        const t = new Date(date)
        if (inUTC) t.setUTCHours(0, 0, 0, 0)
        else t.setHours(0, 0, 0, 0);

        const hc = 0.133 * rad
        let h0 = getMoonPosition(t, lat, lng).altitude - hc

        let h1, h2, rise, set, a, b, xe, ye, d, roots, x1, x2, dx

        // go in 2-hour chunks, each time seeing if a 3-point quadratic curve crosses zero (which means rise or set)
        for (var i = 1; i <= 24; i += 2) {
            h1 = getMoonPosition(hoursLater(t, i), lat, lng).altitude - hc
            h2 = getMoonPosition(hoursLater(t, i + 1), lat, lng).altitude - hc

            a = (h0 + h2) / 2 - h1
            b = (h2 - h0) / 2
            xe = -b / (2 * a)
            ye = (a * xe + b) * xe + h1
            d = b * b - 4 * a * h1
            roots = 0

            if (d >= 0) {
                dx = Math.sqrt(d) / (Math.abs(a) * 2)
                x1 = xe - dx
                x2 = xe + dx
                if (Math.abs(x1) <= 1) roots++
                if (Math.abs(x2) <= 1) roots++
                if (x1 < -1) x1 = x2
            }

            if (roots === 1) {
                if (h0 < 0) rise = i + x1
                else set = i + x1

            } else if (roots === 2) {
                rise = i + (ye < 0 ? x2 : x1)
                set = i + (ye < 0 ? x1 : x2)
            }

            if (rise && set) break

            h0 = h2
        }

        const result: any = {};

        if (rise) result.rise = hoursLater(t, rise)
        if (set) result.set = hoursLater(t, set)

        if (!rise && !set) result[ye > 0 ? 'alwaysUp' : 'alwaysDown'] = true

        return result
    };

    return {
        getPosition,
        addTime,
        getTimes,
        getMoonPosition,
        getMoonIllumination,
        getMoonTimes
    }
}())

