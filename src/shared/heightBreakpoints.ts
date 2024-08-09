const unitMeasurement = 5;

export const feetInchesToGameUnit = (feet: number, inches: number) : number => {
    let totalFeet = feet;
    totalFeet += inches / 12;
    return totalFeet / unitMeasurement;
}

export type sizeCategory = 'fine' | 'diminuative' | 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan' | 'colossal';
export const sizeCategories : Array<sizeCategory> = ['fine', 'diminuative', 'tiny', 'small', 'medium', 'large', 'huge', 'gargantuan', 'colossal'];

export type heightBp = {
    maxHeight : number,
    defaultHeight : number,
    baseDiameter: number,
    size: sizeCategory
}

export const getHeightBpFromHeight = (gameUnitHeight: number) : heightBp => {
    for (let i = 0; i < heightBreakpoints.length; i++) {
        const bp = heightBreakpoints[i];
        if (gameUnitHeight <= bp.maxHeight) {
            return bp;
        }
    }

    return heightBreakpoints[heightBreakpoints.length - 1]; // should be unreachable (here just in case)
}

export const getHeightBpFromSizeCategory = (sizeCat: sizeCategory) : heightBp  => {
    for (let i = 0; i < heightBreakpoints.length; i++) {
        const bp = heightBreakpoints[i];
        if (sizeCat === bp.size) {
            return bp;
        }
    }

    return heightBreakpoints[heightBreakpoints.length - 1]; // should be unreachable (here just in case)
}

export const heightBreakpoints : Array<heightBp> = [
    {
        maxHeight: feetInchesToGameUnit(0,6),
        defaultHeight: feetInchesToGameUnit(0, 4),
        baseDiameter: feetInchesToGameUnit(0, 6),
        size: 'fine'
    },

    {
        maxHeight: feetInchesToGameUnit(1, 0),
        defaultHeight: feetInchesToGameUnit(0, 8),
        baseDiameter: feetInchesToGameUnit(1, 0),
        size: 'diminuative'
    },

    {
        maxHeight: feetInchesToGameUnit(2, 0),
        defaultHeight: feetInchesToGameUnit(1, 8),
        baseDiameter: feetInchesToGameUnit(2, 6),
        size: 'tiny'
    },

    {
        maxHeight: feetInchesToGameUnit(4, 0),
        defaultHeight: feetInchesToGameUnit(3, 6),
        baseDiameter: feetInchesToGameUnit(5, 0),
        size: 'small'
    },

    {
        maxHeight: feetInchesToGameUnit(8, 0),
        defaultHeight: feetInchesToGameUnit(6, 8),
        baseDiameter: feetInchesToGameUnit(5, 0),
        size: 'medium'
    },

    {
        maxHeight: feetInchesToGameUnit(16, 0),
        defaultHeight: feetInchesToGameUnit(14, 0),
        baseDiameter: feetInchesToGameUnit(10, 0),
        size: 'large'
    },
    
    {
        maxHeight: feetInchesToGameUnit(32, 0),
        defaultHeight: feetInchesToGameUnit(28, 0),
        baseDiameter: feetInchesToGameUnit(15, 0),
        size: 'huge'
    },

    {
        maxHeight: feetInchesToGameUnit(64, 0),
        defaultHeight: feetInchesToGameUnit(58, 0),
        baseDiameter: feetInchesToGameUnit(20, 0),
        size: 'gargantuan'
    },

    {
        maxHeight: Infinity,
        defaultHeight: feetInchesToGameUnit(78, 0),
        baseDiameter: feetInchesToGameUnit(30, 0),
        size: 'colossal'
    }
]