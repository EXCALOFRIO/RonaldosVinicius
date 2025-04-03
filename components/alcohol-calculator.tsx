"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/custom-ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/custom-ui/Card"
import { Input } from "@/components/custom-ui/Input"
import { Label } from "@/components/custom-ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/custom-ui/Select"
import { Slider } from "@/components/custom-ui/Slider"
import {
  Info, Plus, Trash2, Beer, Wine, GlassWater, Clock, User, BarChartBig as ChartIcon,
  AlertTriangle, Hourglass, RotateCcw, Weight, Sparkles, Gauge, TimerOff, Ruler, Users,
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts"

// --- Hooks ---
const useWindowWidth = () => {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])
  return width
}

// --- Types ---
type Gender = "male" | "female"
type DrinkType = "beer" | "wine" | "spirits"
type MeasurementUnit = "blood" | "breath"
type DrinkDurationKey = "hidalgo" | "immediate" | "short" | "normal" | "long" | "extended" | "custom"
type BeerPresetKey = "tercio" | "quinto" | "cana" | "pinta" | "custom"
type WinePresetKey = "copa" | "chatrejo" | "doble" | "custom"
type SpiritsPresetKey = "standard" | "double" | "triple" | "custom"

interface Drink {
  id: string
  type: DrinkType
  amount: number
  alcoholPercentage: number
  duration: DrinkDurationKey
  customDuration?: number
  startTime: number
  waitTimeAfterPrevious: number
  beerPreset?: BeerPresetKey
  winePreset?: WinePresetKey
  spiritsPreset?: SpiritsPresetKey
}

interface PersonalFactors {
  gender: Gender
  weight: number
}

// --- Constants ---
const DRINK_DEFAULTS: Record<DrinkType, { amount: number; alcoholPercentage: number; duration: DrinkDurationKey; name: string; icon: React.ElementType; }> = {
  beer: { amount: 330, alcoholPercentage: 5, duration: "normal", name: "Cerveza", icon: Beer },
  wine: { amount: 150, alcoholPercentage: 12, duration: "normal", name: "Vino", icon: Wine },
  spirits: { amount: 50, alcoholPercentage: 40, duration: "short", name: "Cubata", icon: GlassWater },
}
const DURATION_OPTIONS: Record<DrinkDurationKey, { minutes: number; name: string }> = {
  hidalgo: { minutes: 0.1, name: "Hidalgo (0 min)" },
  immediate: { minutes: 5, name: "Rápido (5 min)" },
  short: { minutes: 10, name: "Corto (10 min)" },
  normal: { minutes: 30, name: "Normal (30 min)" },
  long: { minutes: 60, name: "Largo (1 hr)" },
  extended: { minutes: 120, name: "Extendido (2 hr)" },
  custom: { minutes: 0, name: "Personalizado" },
}
const BEER_OPTIONS: Record<BeerPresetKey, { name: string; amount: number; alcoholPercentage: number }> = {
  quinto: { name: "Quinto/Caña (200ml, 5.2%)", amount: 200, alcoholPercentage: 5.2 },
  tercio: { name: "Tercio (330ml, 5.2%)", amount: 330, alcoholPercentage: 5.2 },
  cana: { name: "Caña Doble (400ml, 5.2%)", amount: 400, alcoholPercentage: 5.2 },
  pinta: { name: "Pinta (500ml, 5.2%)", amount: 500, alcoholPercentage: 5.2 },
  custom: { name: "Personalizado", amount: 0, alcoholPercentage: 0 },
}
const WINE_OPTIONS: Record<WinePresetKey, { name: string; amount: number; alcoholPercentage: number }> = {
  chatrejo: { name: "Chatejo (75ml, 12%)", amount: 75, alcoholPercentage: 12 },
  copa: { name: "Copa (150ml, 12%)", amount: 150, alcoholPercentage: 12 },
  doble: { name: "Copa Generosa (250ml, 12%)", amount: 250, alcoholPercentage: 12 },
  custom: { name: "Personalizado", amount: 0, alcoholPercentage: 0 },
}
const SPIRITS_OPTIONS: Record<SpiritsPresetKey, { name: string; amount: number; alcoholPercentage: number }> = {
  standard: { name: "Cubata (50ml, 40%)", amount: 50, alcoholPercentage: 40 },
  double: { name: "Doble (100ml, 40%)", amount: 100, alcoholPercentage: 40 },
  triple: { name: "Enfermedad (150ml, 40%)", amount: 150, alcoholPercentage: 40 },
  custom: { name: "Personalizado", amount: 0, alcoholPercentage: 0 },
}
const DISTRIBUTION_FACTOR: Record<Gender, number> = { male: 0.68, female: 0.55 }
const ETHANOL_DENSITY: number = 0.789
const ELIMINATION_RATE_PER_HOUR: number = 0.15
const ELIMINATION_RATE_PER_MINUTE: number = ELIMINATION_RATE_PER_HOUR / 60
const LEGAL_LIMITS: Record<MeasurementUnit, { standard: number; novelPro: number }> = {
  blood: { standard: 0.5, novelPro: 0.3 },
  breath: { standard: 0.25, novelPro: 0.15 },
}
const BLOOD_BREATH_RATIO: number = 2100
const SIMULATION_TIME_STEP: number = 5
const SIMULATION_MIN_HOURS_AFTER_LAST_DRINK: number = 12
const SIMULATION_SOBER_THRESHOLD_GL: number = 0.005
const SIMULATION_EARLY_EXIT_MINUTES: number = 90
const DEFAULT_WAIT_TIME_MINUTES = 20

// --- Component ---
export default function AlcoholCalculator() {
  const windowWidth = useWindowWidth()
  const isMobile = useMemo(() => windowWidth < 768, [windowWidth])

  const [personalFactors, setPersonalFactors] = useState<PersonalFactors>({ gender: "male", weight: 75 })
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>("blood")
  const [isCalculating, setIsCalculating] = useState(false);

  const getDurationMinutes = useCallback((drink: Drink): number => {
    if (drink.duration === "custom") return Math.max(1, drink.customDuration || 1)
    return Math.max(1, DURATION_OPTIONS[drink.duration]?.minutes || 30)
  }, [])

  const formatTimeAxis = useCallback((minutes: number): string => {
    if (isNaN(minutes) || minutes < 0) return "0h 0m"
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }, [])

  const convertBAC = useCallback((bac_gL: number, targetUnit: MeasurementUnit): number => {
    if (targetUnit === "blood") return bac_gL
    return (bac_gL * 1000) / BLOOD_BREATH_RATIO
  }, [])

  const getLegalLimit = useCallback((unit: MeasurementUnit): number => {
    return LEGAL_LIMITS[unit].standard
  }, [])

  const recalculateStartTimes = useCallback((drinksArray: Drink[], startIndex: number): Drink[] => {
    if (startIndex < 0 || startIndex >= drinksArray.length) return drinksArray
    const recalculatedDrinks = [...drinksArray]
    if (recalculatedDrinks[0]) recalculatedDrinks[0].waitTimeAfterPrevious = 0
    if (startIndex > 0) {
      const prevDrink = recalculatedDrinks[startIndex - 1]
      const prevDuration = getDurationMinutes(prevDrink)
      recalculatedDrinks[startIndex].startTime = prevDrink.startTime + prevDuration + recalculatedDrinks[startIndex].waitTimeAfterPrevious
    }
    for (let i = startIndex + 1; i < recalculatedDrinks.length; i++) {
      const prevDrink = recalculatedDrinks[i - 1]
      const prevDuration = getDurationMinutes(prevDrink)
      recalculatedDrinks[i].startTime = prevDrink.startTime + prevDuration + recalculatedDrinks[i].waitTimeAfterPrevious
    }
    return recalculatedDrinks
  }, [getDurationMinutes])

  const addDrink = useCallback(() => {
    const defaultType: DrinkType = "beer"
    const defaults = DRINK_DEFAULTS[defaultType]
    const defaultWaitTime = DEFAULT_WAIT_TIME_MINUTES
    let newStartTime = 0
    let waitTime = 0
    if (drinks.length > 0) {
      const lastDrink = drinks[drinks.length - 1]
      const lastDuration = getDurationMinutes(lastDrink)
      waitTime = defaultWaitTime
      newStartTime = lastDrink.startTime + lastDuration + waitTime
    }
    const newDrink: Drink = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      type: defaultType,
      amount: defaults.amount,
      alcoholPercentage: defaults.alcoholPercentage,
      duration: defaults.duration,
      customDuration: DURATION_OPTIONS[defaults.duration]?.minutes ?? 30,
      startTime: newStartTime,
      waitTimeAfterPrevious: waitTime,
      beerPreset: "tercio",
    }
    setDrinks((prev) => [...prev, newDrink])
  }, [drinks, getDurationMinutes])

  const removeDrink = useCallback((id: string) => {
    setDrinks((prevDrinks) => {
      const drinkIndexToRemove = prevDrinks.findIndex((drink) => drink.id === id)
      if (drinkIndexToRemove === -1) return prevDrinks
      const remainingDrinks = prevDrinks.filter((drink) => drink.id !== id)
      if (remainingDrinks.length > 0 && drinkIndexToRemove < remainingDrinks.length) {
        return recalculateStartTimes(remainingDrinks, drinkIndexToRemove)
      } else if (remainingDrinks.length > 0 && drinkIndexToRemove === 0) {
        remainingDrinks[0].waitTimeAfterPrevious = 0;
        return recalculateStartTimes(remainingDrinks, 1);
      }
      return remainingDrinks
    })
  }, [recalculateStartTimes])

  const updateDrink = useCallback((id: string, field: keyof Drink | "customDuration" | "beerPreset" | "spiritsPreset" | "winePreset", value: any) => {
    setDrinks((currentDrinks) => {
      let needsRecalculation = false
      let recalculationStartIndex = -1
      const drinkIndex = currentDrinks.findIndex((d) => d.id === id)
      if (drinkIndex === -1) return currentDrinks

      const updatedDrinksIntermediate = currentDrinks.map((drink, index) => {
        if (drink.id !== id) return drink
        let updatedDrink = { ...drink }

        const updateNumericField = (fieldName: keyof Drink, val: any, min = 0, max = Number.POSITIVE_INFINITY, isFloat = false) => {
          const parsedValue = val === "" ? "" : (isFloat ? Number.parseFloat(val) : Number.parseInt(val, 10));
          if (parsedValue === "") {
            (updatedDrink as any)[fieldName] = "";
          } else {
            const numValue = isNaN(parsedValue as number) ? (updatedDrink as any)[fieldName] ?? min : Math.max(min, Math.min(max, parsedValue as number));
            (updatedDrink as any)[fieldName] = numValue;
          }
        }

        switch (field) {
          case "type":
            const newType = value as DrinkType
            const defaults = DRINK_DEFAULTS[newType]
            updatedDrink = {
              ...updatedDrink,
              type: newType,
              amount: defaults.amount,
              alcoholPercentage: defaults.alcoholPercentage,
              duration: defaults.duration,
              customDuration: DURATION_OPTIONS[defaults.duration]?.minutes ?? 30,
              beerPreset: newType === "beer" ? "tercio" : undefined,
              winePreset: newType === "wine" ? "copa" : undefined,
              spiritsPreset: newType === "spirits" ? "standard" : undefined,
            }
            break
          case "duration":
            const newDurationKey = value as DrinkDurationKey;
            updatedDrink.duration = newDurationKey;
            if (newDurationKey === "custom") {
              updatedDrink.customDuration = updatedDrink.customDuration ?? 30;
            } else {
              updatedDrink.customDuration = DURATION_OPTIONS[newDurationKey]?.minutes ?? 30;
            }
            needsRecalculation = true;
            recalculationStartIndex = drinkIndex + 1;
            break;
          case "customDuration":
            updatedDrink.duration = "custom";
            updateNumericField("customDuration", value, 1, 600);
            needsRecalculation = true;
            recalculationStartIndex = drinkIndex + 1;
            break;
          case "beerPreset":
            if (updatedDrink.type === "beer") {
              const beerPresetKey = value as BeerPresetKey;
              updatedDrink.beerPreset = beerPresetKey;
              updatedDrink.winePreset = undefined;
              updatedDrink.spiritsPreset = undefined;
              if (beerPresetKey !== "custom" && BEER_OPTIONS[beerPresetKey]) {
                const presetValues = BEER_OPTIONS[beerPresetKey];
                updatedDrink.amount = presetValues.amount;
                updatedDrink.alcoholPercentage = presetValues.alcoholPercentage;
              }
            }
            break;
          case "winePreset":
            if (updatedDrink.type === "wine") {
              const winePresetKey = value as WinePresetKey;
              updatedDrink.winePreset = winePresetKey;
              updatedDrink.beerPreset = undefined;
              updatedDrink.spiritsPreset = undefined;
              if (winePresetKey !== "custom" && WINE_OPTIONS[winePresetKey]) {
                const presetValues = WINE_OPTIONS[winePresetKey];
                updatedDrink.amount = presetValues.amount;
                updatedDrink.alcoholPercentage = presetValues.alcoholPercentage;
              }
            }
            break;
          case "spiritsPreset":
            if (updatedDrink.type === "spirits") {
              const spiritsPresetKey = value as SpiritsPresetKey;
              updatedDrink.spiritsPreset = spiritsPresetKey;
              updatedDrink.beerPreset = undefined;
              updatedDrink.winePreset = undefined;
              if (spiritsPresetKey !== "custom" && SPIRITS_OPTIONS[spiritsPresetKey]) {
                const presetValues = SPIRITS_OPTIONS[spiritsPresetKey];
                updatedDrink.amount = presetValues.amount;
                updatedDrink.alcoholPercentage = presetValues.alcoholPercentage;
              }
            }
            break;
          case "amount":
            updateNumericField("amount", value, 1, 5000);
            if (updatedDrink.type === "beer") updatedDrink.beerPreset = "custom";
            else if (updatedDrink.type === "wine") updatedDrink.winePreset = "custom";
            else if (updatedDrink.type === "spirits") updatedDrink.spiritsPreset = "custom";
            break;
          case "alcoholPercentage":
            updateNumericField("alcoholPercentage", value, 0, 100, true);
            if (updatedDrink.type === "beer") updatedDrink.beerPreset = "custom";
            else if (updatedDrink.type === "wine") updatedDrink.winePreset = "custom";
            else if (updatedDrink.type === "spirits") updatedDrink.spiritsPreset = "custom";
            break;
          case "startTime":
            if (drinkIndex === 0) {
              updateNumericField("startTime", value, 0, 10080);
              updatedDrink.waitTimeAfterPrevious = 0;
              needsRecalculation = true;
              recalculationStartIndex = 1;
            }
            break;
          case "waitTimeAfterPrevious":
            if (drinkIndex > 0) {
              updateNumericField("waitTimeAfterPrevious", value, 0, 1440);
              needsRecalculation = true;
              recalculationStartIndex = drinkIndex;
            }
            break;
          default:
            console.warn("Unhandled drink update field:", field)
            break
        }
        return updatedDrink
      })

      if (needsRecalculation && recalculationStartIndex >= 0) {
        if (recalculationStartIndex < updatedDrinksIntermediate.length) {
          return recalculateStartTimes(updatedDrinksIntermediate, recalculationStartIndex)
        }
        return updatedDrinksIntermediate;
      }
      return updatedDrinksIntermediate
    })
  }, [recalculateStartTimes, getDurationMinutes])

  const calculateBAC = useCallback((timeInMinutes: number, currentDrinks: Readonly<Drink[]>, factors: Readonly<PersonalFactors>): number => {
    if (currentDrinks.length === 0 || !factors.weight || factors.weight <= 0) return 0;
    const { gender, weight } = factors;
    const r = DISTRIBUTION_FACTOR[gender];
    const bodyWaterLitres = weight * r;
    if (bodyWaterLitres <= 0) return 0;

    let totalBAC_gL = 0;

    currentDrinks.forEach((drink) => {
      const effectivePercentage = drink.alcoholPercentage;
      const amountMl = drink.amount;
      const validAmountMl = typeof amountMl === 'number' && !isNaN(amountMl) ? amountMl : 0;
      const validPercentage = typeof effectivePercentage === 'number' && !isNaN(effectivePercentage) ? effectivePercentage : 0;
      const totalAlcoholGrams = validAmountMl * (validPercentage / 100) * ETHANOL_DENSITY;
      if (totalAlcoholGrams <= 0) return;

      const durationMinutes = getDurationMinutes(drink);
      const startTime = drink.startTime;
      const endTime = startTime + durationMinutes;

      if (timeInMinutes <= startTime) return;

      let ingestedAlcoholGrams: number;
      if (timeInMinutes < endTime) {
        const timeSpentDrinking = timeInMinutes - startTime;
        const fractionIngested = durationMinutes > 0 ? timeSpentDrinking / durationMinutes : 1;
        ingestedAlcoholGrams = totalAlcoholGrams * Math.min(1, Math.max(0, fractionIngested));
      } else {
        ingestedAlcoholGrams = totalAlcoholGrams;
      }

      const potentialBACFromIngested = ingestedAlcoholGrams / bodyWaterLitres;

      let eliminationDurationMinutes: number;
      if (timeInMinutes < endTime) {
        const timeSpentDrinking = timeInMinutes - startTime;
        eliminationDurationMinutes = timeSpentDrinking / 2;
      } else {
        const averageAbsorptionTimePoint = startTime + (durationMinutes > 0 ? durationMinutes / 2 : 0);
        eliminationDurationMinutes = timeInMinutes - averageAbsorptionTimePoint;
      }
      eliminationDurationMinutes = Math.max(0, eliminationDurationMinutes);

      const eliminatedBAC = ELIMINATION_RATE_PER_MINUTE * eliminationDurationMinutes;
      const netBACFromDrink = Math.max(0, potentialBACFromIngested - eliminatedBAC);

      totalBAC_gL += netBACFromDrink;
    });

    return Math.max(0, totalBAC_gL);
  }, [getDurationMinutes])

  useEffect(() => {
    setIsCalculating(true);
    if (!personalFactors.weight || personalFactors.weight <= 0) {
      setChartData([]);
      setIsCalculating(false);
      return;
    }

    const sortedDrinks = [...drinks]
      .filter(d => typeof d.amount === 'number' && typeof d.alcoholPercentage === 'number' && typeof d.startTime === 'number' && typeof d.waitTimeAfterPrevious === 'number')
      .sort((a, b) => a.startTime - b.startTime);

    if (sortedDrinks.length === 0) {
      setChartData([]);
      setIsCalculating(false);
      return;
    }

    const lastDrinkEndTime = sortedDrinks.reduce((maxEndTime, drink) => {
      const duration = getDurationMinutes(drink);
      const endTime = (typeof drink.startTime === 'number' ? drink.startTime : 0) + duration;
      return Math.max(maxEndTime, isNaN(endTime) ? 0 : endTime);
    }, 0);

    let roughPeakPotential_gL = 0;
    if (personalFactors.weight > 0) {
      const r = DISTRIBUTION_FACTOR[personalFactors.gender];
      const bodyWaterLitres = personalFactors.weight * r;
      if (bodyWaterLitres > 0) {
        roughPeakPotential_gL = sortedDrinks.reduce((sum, drink) => {
          const amount = typeof drink.amount === 'number' ? drink.amount : 0;
          const percentage = typeof drink.alcoholPercentage === 'number' ? drink.alcoholPercentage : 0;
          const totalAlcoholGrams = amount * (percentage / 100) * ETHANOL_DENSITY;
          return sum + (totalAlcoholGrams / bodyWaterLitres);
        }, 0);
      }
    }
    const roughHoursToSober = roughPeakPotential_gL > 0 ? (roughPeakPotential_gL / ELIMINATION_RATE_PER_HOUR) * 1.5 : 0;
    const simulationEndTimeMinutes = Math.ceil(lastDrinkEndTime + Math.max(SIMULATION_MIN_HOURS_AFTER_LAST_DRINK * 60, roughHoursToSober * 60));

    const dataPoints: any[] = [];
    let consecutiveLowPoints = 0;
    const soberThresholdDisplay = convertBAC(SIMULATION_SOBER_THRESHOLD_GL, measurementUnit);
    const earlyExitStepsThreshold = Math.ceil(SIMULATION_EARLY_EXIT_MINUTES / SIMULATION_TIME_STEP);

    for (let t = 0; t <= simulationEndTimeMinutes; t += SIMULATION_TIME_STEP) {
      const bloodBAC_gL = calculateBAC(t, sortedDrinks, personalFactors);
      const displayBAC = convertBAC(bloodBAC_gL, measurementUnit);

      dataPoints.push({
        timeMinutes: t,
        bac: displayBAC,
        timeFormatted: formatTimeAxis(t),
      });

      if (displayBAC < soberThresholdDisplay) {
        consecutiveLowPoints++;
      } else {
        consecutiveLowPoints = 0;
      }

      if (t > lastDrinkEndTime && consecutiveLowPoints >= earlyExitStepsThreshold) {
        if (dataPoints.length > 0 && dataPoints[dataPoints.length - 1].bac > soberThresholdDisplay * 1.1) {
          const finalTime = t + SIMULATION_TIME_STEP
          dataPoints.push({ timeMinutes: finalTime, bac: 0, timeFormatted: formatTimeAxis(finalTime) });
        } else if (dataPoints.length > 0 && dataPoints[dataPoints.length - 1].bac > 0) {
          dataPoints[dataPoints.length - 1].bac = 0;
        }
        break;
      }
    }

    if (dataPoints.length > 0 && dataPoints[dataPoints.length - 1].bac > 0) {
      const lastTime = dataPoints[dataPoints.length - 1].timeMinutes;
      const finalTime = lastTime + SIMULATION_TIME_STEP;
      dataPoints.push({ timeMinutes: finalTime, bac: 0, timeFormatted: formatTimeAxis(finalTime) });
    }

    requestAnimationFrame(() => {
      setChartData(dataPoints);
      setIsCalculating(false);
    });
  }, [drinks, personalFactors, measurementUnit, getDurationMinutes, calculateBAC, convertBAC, formatTimeAxis])

  const peakBAC = useMemo(() => {
    if (chartData.length === 0) return { value: 0, timeMinutes: 0, timeFormatted: "0h 0m" };
    const peakPoint = chartData.reduce(
      (max, point) => (point.bac > max.bac ? point : max),
      { bac: Number.NEGATIVE_INFINITY, timeMinutes: 0 }
    );
    if (peakPoint.bac <= 0 || peakPoint.bac === Number.NEGATIVE_INFINITY) {
      return { value: 0, timeMinutes: 0, timeFormatted: "0h 0m" };
    }
    const firstPeakPoint = chartData.find((p) => p.bac === peakPoint.bac) || peakPoint;
    return {
      value: firstPeakPoint.bac,
      timeMinutes: firstPeakPoint.timeMinutes,
      timeFormatted: formatTimeAxis(firstPeakPoint.timeMinutes),
    };
  }, [chartData, formatTimeAxis]);

  const legalLimitValue = useMemo(() => getLegalLimit(measurementUnit), [measurementUnit, getLegalLimit]);

  const timeAboveLimit = useMemo(() => {
    if (chartData.length < 2) return { minutes: 0, formatted: "0h 0m" };
    const limit = legalLimitValue;
    let minutesAbove = 0;
    const timeStep = chartData.length > 1 ? chartData[1].timeMinutes - chartData[0].timeMinutes : SIMULATION_TIME_STEP;
    if (timeStep <= 0) return { minutes: 0, formatted: "0h 0m" };

    for (let i = 1; i < chartData.length; i++) {
      const prevPoint = chartData[i - 1];
      const point = chartData[i];
      if (typeof prevPoint?.bac !== 'number' || typeof point?.bac !== 'number') continue;

      const prevAbove = prevPoint.bac >= limit;
      const currAbove = point.bac >= limit;

      if (currAbove && prevAbove) {
        minutesAbove += timeStep;
      } else if (currAbove && !prevAbove) {
        const bacDiff = point.bac - prevPoint.bac;
        if (bacDiff > 0) {
          const timeToCross = ((limit - prevPoint.bac) / bacDiff) * timeStep;
          minutesAbove += Math.max(0, timeStep - timeToCross);
        } else {
          minutesAbove += timeStep / 2;
        }
      } else if (!currAbove && prevAbove) {
        const bacDiff = prevPoint.bac - point.bac;
        if (bacDiff > 0) {
          const timeToCross = ((prevPoint.bac - limit) / bacDiff) * timeStep;
          minutesAbove += Math.max(0, timeToCross);
        } else {
          minutesAbove += timeStep / 2;
        }
      }
    }
    const roundedMinutes = Math.round(minutesAbove);
    return { minutes: roundedMinutes, formatted: formatTimeAxis(roundedMinutes) };
  }, [chartData, legalLimitValue, formatTimeAxis]);

  const timeToSober = useMemo(() => {
    if (chartData.length === 0) return { minutes: 0, formatted: "0h 0m", isEstimate: false };
    const soberDisplayThreshold = convertBAC(SIMULATION_SOBER_THRESHOLD_GL, measurementUnit) * 1.05;
    let timeToSoberMinutes = 0;
    let foundSoberTime = false;
    const everAboveThreshold = chartData.some(p => p.bac >= soberDisplayThreshold * 1.1);

    for (let i = 1; i < chartData.length; i++) {
      const prevPoint = chartData[i - 1];
      const point = chartData[i];
      if (typeof prevPoint?.bac !== 'number' || typeof point?.bac !== 'number') continue;

      if (prevPoint.bac >= soberDisplayThreshold && point.bac < soberDisplayThreshold) {
        const bacDiff = prevPoint.bac - point.bac;
        const timeDiff = point.timeMinutes - prevPoint.timeMinutes;
        if (bacDiff > 0 && timeDiff > 0) {
          const timeFraction = (prevPoint.bac - soberDisplayThreshold) / bacDiff;
          timeToSoberMinutes = Math.ceil(prevPoint.timeMinutes + timeFraction * timeDiff);
        } else {
          timeToSoberMinutes = Math.ceil(point.timeMinutes);
        }
        foundSoberTime = true;
        break;
      }
    }

    if (!foundSoberTime && everAboveThreshold) {
      const lastPoint = chartData[chartData.length - 1];
      if (lastPoint && typeof lastPoint.bac === 'number' && typeof lastPoint.timeMinutes === 'number') {
        if (lastPoint.bac < soberDisplayThreshold) {
          timeToSoberMinutes = Math.ceil(lastPoint.timeMinutes);
          foundSoberTime = true;
        } else {
          return {
            minutes: lastPoint.timeMinutes,
            formatted: `> ${formatTimeAxis(lastPoint.timeMinutes)}`,
            isEstimate: true,
          };
        }
      }
    }

    if (!everAboveThreshold && !foundSoberTime) {
      return { minutes: 0, formatted: "0h 0m", isEstimate: false };
    }

    if (foundSoberTime) {
      return {
        minutes: timeToSoberMinutes,
        formatted: formatTimeAxis(timeToSoberMinutes),
        isEstimate: false,
      };
    }

    return { minutes: 0, formatted: "0h 0m", isEstimate: false };
  }, [chartData, measurementUnit, formatTimeAxis, convertBAC]);

  const CustomTooltipContent = useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length && label !== undefined) {
      const dataPoint = payload[0].payload;
      if (!dataPoint || typeof dataPoint.timeMinutes !== 'number' || typeof payload[0].value !== 'number') return null;
      const timeMinutes = dataPoint.timeMinutes;
      const bacValue = payload[0].value;
      const unit = measurementUnit === "blood" ? "g/l" : "mg/l";

      return (
        <div className="bg-popover text-popover-foreground border border-border rounded-lg shadow-xl p-3 px-4 text-sm">
          <p className="font-semibold mb-1 text-base">Tiempo: {formatTimeAxis(timeMinutes)}</p>
          <p className="text-primary font-bold text-lg">
            {bacValue.toFixed(measurementUnit === "blood" ? 3 : 2)} {unit}
          </p>
        </div>
      );
    }
    return null;
  }, [measurementUnit, formatTimeAxis]);

  return (
    <div className="space-y-10 md:space-y-14 lg:space-y-16 max-w-full mx-auto">
      <Card className="shadow-lg overflow-hidden border-border">
        <CardHeader className="bg-muted/40 dark:bg-muted/20 border-b border-border p-5 md:p-6">
          <CardTitle className="flex items-center gap-3 text-xl md:text-2xl font-semibold">
            <User className="h-6 w-6 text-primary" /> Factores Personales
          </CardTitle>
          <CardDescription className="text-sm md:text-base text-muted-foreground pt-1">
            Ajusta los factores que influyen en el metabolismo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 md:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
          {/* Unidad de Medida */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="measurement-unit" className="flex items-center gap-1.5 text-base font-medium">
              <Ruler className="h-5 w-5 text-muted-foreground" /> Unidad Medida
            </Label>
            <Select
              defaultValue={measurementUnit}
              defaultLabel={measurementUnit === "blood" ? "Sangre (g/l)" : "Aire Espirado (mg/l)"}
              onValueChange={(value: MeasurementUnit) => setMeasurementUnit(value)}
            >
              <SelectTrigger id="measurement-unit" className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blood" className="text-base py-2">Sangre (g/l)</SelectItem>
                <SelectItem value="breath" className="text-base py-2">Aire Espirado (mg/l)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sexo Biológico */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="gender" className="flex items-center gap-1.5 text-base font-medium">
              <Users className="h-5 w-5 text-muted-foreground" /> Sexo Biológico
            </Label>
            <Select
              defaultValue={personalFactors.gender}
              defaultLabel={personalFactors.gender === "male" ? "Hombre" : "Mujer"}
              onValueChange={(value: Gender) => setPersonalFactors((p) => ({ ...p, gender: value }))}
            >
              <SelectTrigger id="gender" className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male" className="text-base py-2">Hombre</SelectItem>
                <SelectItem value="female" className="text-base py-2">Mujer</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground pt-1">
              Factor de distribución de agua corporal (r).
            </p>
          </div>

          {/* Peso */}
          <div className="flex flex-col space-y-3 md:col-span-1">
            <Label htmlFor="weight" className="text-base font-medium flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <Weight className="h-5 w-5 text-muted-foreground" /> Peso
              </span>
              <span className="font-mono text-primary text-lg font-semibold bg-muted/70 dark:bg-muted/40 px-3 py-1 rounded-md">
                {personalFactors.weight} kg
              </span>
            </Label>
            <Slider
              id="weight"
              min={30}
              max={200}
              step={1}
              // Pasa el valor directamente (toString es buena idea si weight es number)
              value={personalFactors.weight.toString()}
              // Usa la prop estándar 'onChange' que espera el input nativo
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  // Obtén el valor del evento (siempre es string) y conviértelo a número
                  const newWeight = Number(event.target.value);
                  // Actualiza el estado usando la función de callback para seguridad
                  setPersonalFactors((prevFactors) => ({
                      ...prevFactors,
                      weight: newWeight
                  }));
                }}
              className="py-2"
            />
            {(!personalFactors.weight || personalFactors.weight <= 0) && (
              <p className="text-sm text-destructive font-medium !mt-2">El peso debe ser mayor que 0.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg overflow-hidden border-border">
        <CardHeader className="bg-muted/40 dark:bg-muted/20 border-b border-border p-5 md:p-6">
          <CardTitle className="flex items-center gap-3 text-xl md:text-2xl font-semibold">
            <Beer className="h-6 w-6 text-primary" /> Bebidas Consumidas
          </CardTitle>
          <CardDescription className="text-sm md:text-base text-muted-foreground pt-1 leading-relaxed">
            Añade cada bebida. Para la <strong className="text-foreground/90">primera</strong>, ajusta el inicio (<Clock size={14} className="inline -mt-0.5"/>). Para las <strong className="text-foreground/90">siguientes</strong>, indica el tiempo de <strong className="text-foreground/90">espera</strong> (<Hourglass size={14} className="inline -mt-0.5"/>) tras <strong className="text-foreground/90">terminar</strong> la anterior.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 md:p-6 lg:p-8 space-y-6 md:space-y-8">
          {drinks.length === 0 ? (
            <div className="text-center py-12 md:py-20 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl bg-muted/20 dark:bg-muted/10">
              <GlassWater className="h-16 w-16 md:h-20 md:w-20 mx-auto mb-5 opacity-30" />
              <p className="mb-6 text-lg md:text-xl">Aún no has añadido ninguna bebida.</p>
              <Button onClick={addDrink} size="lg" className="h-12 px-8 text-base font-semibold">
                <Plus className="mr-2 h-5 w-5" /> Añadir Primera Bebida
              </Button>
            </div>
          ) : (
            <>
              {drinks.map((drink, index) => {
                const DrinkIcon = DRINK_DEFAULTS[drink.type]?.icon || GlassWater
                const durationMinutes = getDurationMinutes(drink)
                const startTimeNum = typeof drink.startTime === 'number' ? drink.startTime : 0;
                const startTimeFormatted = formatTimeAxis(startTimeNum)
                const endTimeFormatted = formatTimeAxis(startTimeNum + durationMinutes)
                const isBeer = drink.type === "beer", isWine = drink.type === "wine", isSpirits = drink.type === "spirits"
                const presetIsCustom = isBeer ? drink.beerPreset === "custom" || !drink.beerPreset :
                                      isWine ? drink.winePreset === "custom" || !drink.winePreset :
                                      isSpirits ? drink.spiritsPreset === "custom" || !drink.spiritsPreset : true;
                const amountIsEmpty = drink.amount <= 0;
                const percentIsEmpty = typeof drink.alcoholPercentage === "string" && drink.alcoholPercentage === "";
                const customDurationIsEmpty = drink.duration === "custom" && (drink.customDuration === null || drink.customDuration === undefined);
                const startTimeIsEmpty = index === 0 && typeof drink.startTime === "string" && drink.startTime === "";
                const waitTimeIsEmpty = index < 0 && drink.waitTimeAfterPrevious === 0;

                return (
                  <div key={drink.id} className="p-5 md:p-6 bg-card border border-border/80 rounded-xl relative shadow-md group">
                    <span className="absolute -top-4 -left-4 w-10 h-10 md:w-11 md:h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-base md:text-lg shadow-lg border-4 border-background z-10">
                      {index + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-9 w-9 md:h-10 md:w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeDrink(drink.id)}
                      aria-label={`Eliminar bebida ${index + 1}`}
                    >
                      <Trash2 className="h-5 w-5 md:h-[1.15rem] md:w-[1.15rem]" />
                    </Button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mt-5">
                      <div className="space-y-4 md:space-y-5">
                        <div>
                          <Label className="text-base font-medium flex items-center gap-1.5 mb-2">
                            <DrinkIcon className="h-5 w-5 text-muted-foreground" /> Tipo
                          </Label>
                          <Select
                            defaultValue={drink.type}
                            defaultLabel={DRINK_DEFAULTS[drink.type].name}
                            onValueChange={(value: DrinkType) => updateDrink(drink.id, "type", value)}
                          >
                            <SelectTrigger aria-label={`Tipo de bebida ${index + 1}`} className="h-12 text-base">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(DRINK_DEFAULTS).map(([key, { name, icon: Icon }]) => (
                                <SelectItem key={key} value={key} className="text-base py-2.5">
                                  <Icon className="h-5 w-5 inline mr-2 opacity-70" /> {name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {isBeer && (
                          <div>
                            <Label htmlFor={`beer-preset-${drink.id}`} className="text-base font-medium mb-2">Tamaño Cerveza</Label>
                            <Select
                              defaultValue={drink.beerPreset || "custom"}
                              defaultLabel={drink.beerPreset ? BEER_OPTIONS[drink.beerPreset].name : "Personalizado"}
                              onValueChange={(value: BeerPresetKey) => updateDrink(drink.id, "beerPreset", value)}
                            >
                              <SelectTrigger id={`beer-preset-${drink.id}`} className="h-12 text-base">
                                <SelectValue placeholder="Selecciona..." />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(BEER_OPTIONS).map(([key, { name }]) => (
                                  <SelectItem className="text-base py-2.5" key={key} value={key}>{name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {isWine && (
                          <div>
                            <Label htmlFor={`wine-preset-${drink.id}`} className="text-base font-medium mb-2">Tamaño Vino</Label>
                            <Select
                              defaultValue={drink.winePreset || "copa"}
                              defaultLabel={drink.winePreset ? WINE_OPTIONS[drink.winePreset].name : "Personalizado"}
                              onValueChange={(value: WinePresetKey) => updateDrink(drink.id, "winePreset", value)}
                            >
                              <SelectTrigger id={`wine-preset-${drink.id}`} className="h-12 text-base">
                                <SelectValue placeholder="Selecciona..." />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(WINE_OPTIONS).map(([key, { name }]) => (
                                  <SelectItem className="text-base py-2.5" key={key} value={key}>{name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {isSpirits && (
                          <div>
                            <Label htmlFor={`spirits-preset-${drink.id}`} className="text-base font-medium mb-2">Tamaño Destilado</Label>
                            <Select
                              defaultValue={drink.spiritsPreset || "standard"}
                              defaultLabel={drink.spiritsPreset ? SPIRITS_OPTIONS[drink.spiritsPreset].name : "Personalizado"}
                              onValueChange={(value: SpiritsPresetKey) => updateDrink(drink.id, "spiritsPreset", value)}
                            >
                              <SelectTrigger id={`spirits-preset-${drink.id}`} className="h-12 text-base">
                                <SelectValue placeholder="Selecciona..." />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(SPIRITS_OPTIONS).map(([key, { name }]) => (
                                  <SelectItem className="text-base py-2.5" key={key} value={key}>{name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 md:space-y-5">
                        {presetIsCustom ? (
                          <>
                            <div>
                              <Label htmlFor={`drink-amount-${drink.id}`} className="text-base font-medium mb-2">Volumen (ml)</Label>
                              <Input
                                id={`drink-amount-${drink.id}`}
                                type="number"
                                value={drink.amount}
                                onChange={(e) => updateDrink(drink.id, "amount", e.target.value)}
                                min="1"
                                placeholder="Ej: 330"
                                className={`h-12 text-base ${amountIsEmpty ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                aria-invalid={amountIsEmpty}
                              />
                              {amountIsEmpty && <p className="text-xs text-destructive mt-1">Introduce volumen</p>}
                            </div>
                            <div>
                              <Label htmlFor={`drink-percentage-${drink.id}`} className="text-base font-medium mb-2">% Alcohol (ABV)</Label>
                              <Input
                                id={`drink-percentage-${drink.id}`}
                                type="number"
                                value={drink.alcoholPercentage}
                                onChange={(e) => updateDrink(drink.id, "alcoholPercentage", e.target.value)}
                                min="0" max="100" step="0.1"
                                placeholder="Ej: 5.0"
                                className={`h-12 text-base ${percentIsEmpty ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                aria-invalid={percentIsEmpty}
                              />
                              {percentIsEmpty && <p className="text-xs text-destructive mt-1">Introduce %</p>}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm space-y-1.5 pt-1 text-muted-foreground border border-dashed border-border/60 rounded-lg px-4 py-3 bg-muted/30 dark:bg-muted/20 mt-7">
                            <p><span className="font-medium text-foreground/80">Volumen:</span> {drink.amount} ml</p>
                            <p><span className="font-medium text-foreground/80">Alcohol:</span> {drink.alcoholPercentage}%</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 md:space-y-5">
                        <div>
                          {index === 0 ? (
                            <>
                              <Label htmlFor={`start-time-${drink.id}`} className="text-base font-medium mb-2 flex items-center gap-1.5"><Clock className="h-5 w-5 text-muted-foreground" /> Inicio 1ª Bebida (min)</Label>
                              <div className="flex items-center space-x-2">
                                <Input
                                  id={`start-time-${drink.id}`}
                                  type="number" value={drink.startTime}
                                  onChange={(e) => updateDrink(drink.id, "startTime", e.target.value)}
                                  min="0" placeholder="Minutos"
                                  className={`h-12 text-base flex-grow ${startTimeIsEmpty ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                  aria-invalid={startTimeIsEmpty}
                                />
                                <Button variant="outline" size="icon" onClick={() => updateDrink(drink.id, "startTime", 0)} title="Reiniciar inicio a 0 minutos" className="h-12 w-12 flex-shrink-0">
                                  <RotateCcw className="h-5 w-5" />
                                </Button>
                              </div>
                              {startTimeIsEmpty && <p className="text-xs text-destructive mt-1">Introduce inicio</p>}
                            </>
                          ) : (
                            <>
                              <Label htmlFor={`wait-time-${drink.id}`} className="text-base font-medium mb-2 flex items-center gap-1.5"><Hourglass className="h-5 w-5 text-muted-foreground" /> Espera Tras Anterior (min)</Label>
                              <Input
                                id={`wait-time-${drink.id}`}
                                type="number" value={drink.waitTimeAfterPrevious}
                                onChange={(e) => updateDrink(drink.id, "waitTimeAfterPrevious", e.target.value)}
                                min="0" placeholder="Minutos espera"
                                className={`h-12 text-base ${waitTimeIsEmpty ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                aria-invalid={waitTimeIsEmpty}
                              />
                              {waitTimeIsEmpty && <p className="text-xs text-destructive mt-1">Introduce espera</p>}
                            </>
                          )}
                          {index > 0 && typeof drink.startTime === 'number' && (
                            <p className="text-xs text-muted-foreground mt-1">Inicio calculado: <span className="font-medium text-foreground/90">{startTimeFormatted}</span></p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor={`duration-select-${drink.id}`} className="text-base font-medium mb-2">Duración Consumo</Label>
                          <Select
                            defaultValue={drink.duration}
                            defaultLabel={DURATION_OPTIONS[drink.duration].name}
                            onValueChange={(value: DrinkDurationKey) => updateDrink(drink.id, "duration", value)}
                          >
                            <SelectTrigger id={`duration-select-${drink.id}`} className="h-12 text-base">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(DURATION_OPTIONS).map(([key, { name }]) => (
                                <SelectItem className="text-base py-2.5" key={key} value={key}>{name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {drink.duration === "custom" && (
                            <div className="mt-2">
                              <Label htmlFor={`custom-duration-${drink.id}`} className="sr-only">Duración Personalizada (minutos)</Label>
                              <Input
                                id={`custom-duration-${drink.id}`}
                                type="number" value={drink.customDuration ?? ""}
                                onChange={(e) => updateDrink(drink.id, "customDuration", e.target.value)}
                                placeholder="Minutos (ej: 45)" min="1"
                                className={`h-12 text-base ${customDurationIsEmpty ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                aria-invalid={customDurationIsEmpty}
                              />
                              {customDurationIsEmpty && <p className="text-xs text-destructive mt-1">Introduce duración</p>}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">Tiempo para consumir: <span className="font-medium text-foreground/90">{durationMinutes} min</span></p>
                        </div>
                      </div>

                      <div className="space-y-2 bg-muted/40 dark:bg-muted/20 p-4 rounded-lg h-full flex flex-col justify-center text-center sm:text-left">
                        <p className="text-base font-medium text-muted-foreground mb-1.5">Tiempos Estimados:</p>
                        <div className="text-base font-mono space-y-1 text-foreground/90">
                          <p><span className="text-xs text-muted-foreground">Inicio:</span> {startTimeFormatted}</p>
                          <p><span className="text-xs text-muted-foreground">Fin:</span> {endTimeFormatted}</p>
                          {index > 0 && <p><span className="text-xs text-muted-foreground">Espera previa:</span> {drink.waitTimeAfterPrevious} min</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              <Button
                onClick={addDrink}
                variant="outline"
                className="w-full mt-6 h-12 text-base font-semibold border-2 border-dashed hover:border-solid hover:bg-muted/50 dark:hover:bg-muted/30"
              >
                <Plus className="mr-2 h-5 w-5" /> Añadir Otra Bebida ({drinks.length > 0 ? `Espera Def: ${DEFAULT_WAIT_TIME_MINUTES} min` : 'Inicio en 0 min'})
              </Button>

              {drinks.length > 1 && (
                <Button
                  onClick={() => { setDrinks((currentDrinks) => recalculateStartTimes(currentDrinks, 1)); }}
                  variant="secondary"
                  size="sm"
                  className="w-full mt-3 h-10 text-sm font-medium"
                  title="Vuelve a calcular todos los tiempos de inicio desde la segunda bebida."
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Forzar Recálculo de Tiempos
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg overflow-hidden border-border">
        <CardHeader className="bg-muted/40 dark:bg-muted/20 border-b border-border p-5 md:p-6">
          <CardTitle className="flex items-center gap-3 text-xl md:text-2xl font-semibold">
            <ChartIcon className="h-6 w-6 text-primary" /> Resultados Estimados
          </CardTitle>
          <CardDescription className="text-sm md:text-base text-muted-foreground pt-1">
            Nivel de alcohol ({measurementUnit === "blood" ? "Sangre g/l" : "Aire mg/l"}). Tasa elim. <strong className="text-foreground/80">promedio</strong>: {ELIMINATION_RATE_PER_HOUR.toFixed(2)} g/L/h.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 md:p-6 lg:p-8 space-y-8 md:space-y-10">
          {!personalFactors.weight || personalFactors.weight <= 0 ? (
            <div className="text-center py-12 md:py-16 text-destructive border-2 border-dashed border-destructive/50 rounded-xl bg-destructive/5">
              <AlertTriangle className="h-16 w-16 md:h-20 md:w-20 mx-auto mb-5 opacity-70" />
              <p className="text-lg md:text-xl font-semibold">
                Introduce un peso válido para calcular.
              </p>
            </div>
          ) : drinks.length === 0 ? (
            <div className="text-center py-12 md:py-16 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl bg-muted/20 dark:bg-muted/10">
              <Info className="h-16 w-16 md:h-20 md:w-20 mx-auto mb-5 opacity-30" />
              <p className="text-lg md:text-xl mb-6">Añade bebidas para ver la simulación.</p>
              <Button onClick={addDrink} size="lg" className="h-12 px-8 text-base font-semibold">
                Añadir Bebida
              </Button>
            </div>
          ) : isCalculating ? (
            <div className="text-center py-16 md:py-24 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl bg-muted/20 dark:bg-muted/10">
              <Hourglass className="h-16 w-16 md:h-20 md:w-20 mx-auto mb-5 opacity-60 animate-spin" />
              <p className="text-lg md:text-xl">Calculando simulación...</p>
            </div>
          ) : chartData.length === 0 && drinks.length > 0 ? (
            <div className="text-center py-12 md:py-16 text-destructive border-2 border-dashed border-destructive/50 rounded-xl bg-destructive/5">
              <AlertTriangle className="h-16 w-16 md:h-20 md:w-20 mx-auto mb-5 opacity-70" />
              <p className="text-lg md:text-xl font-semibold">
                No se pudieron generar datos. Verifica las entradas de las bebidas.
              </p>
            </div>
          ) : (
            <>
              <div className={`relative w-full h-[400px] sm:h-[450px] md:h-[500px] bg-card border border-border/60 rounded-xl shadow-inner p-2 md:p-4 overflow-hidden`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={isMobile ? { top: 25, right: 25, left: 5, bottom: 30 } : { top: 30, right: 40, left: 20, bottom: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                    <XAxis
                      dataKey="timeMinutes" type="number"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={formatTimeAxis}
                      label={{ value: "Tiempo", position: "insideBottom", offset: -15, fontSize: isMobile ? 12 : 14, fill: "hsl(var(--muted-foreground))" }}
                      tick={{ fontSize: isMobile ? 10 : 12, fill: "hsl(var(--muted-foreground))" }}
                      interval="preserveStartEnd" minTickGap={isMobile ? 45 : 40}
                      axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                      tickLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                    />
                    <YAxis
                      yAxisId="left"
                      label={{ value: measurementUnit === "blood" ? "BAC (g/l)" : "BrAC (mg/l)", angle: -90, position: "insideLeft", offset: isMobile ? 0 : -5, fontSize: isMobile ? 12 : 14, fill: "hsl(var(--muted-foreground))" }}
                      domain={[0, 'auto']}
                      tick={{ fontSize: isMobile ? 10 : 12, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => value.toFixed(measurementUnit === "breath" ? 2 : 3)}
                      allowDecimals={true}
                      width={isMobile ? 50 : 65}
                      axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                      tickLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                    />
                    <Tooltip
                      content={<CustomTooltipContent />}
                      cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                      wrapperStyle={{ zIndex: 10 }}
                    />
                    <Legend
                      verticalAlign="top" height={36}
                      wrapperStyle={{ fontSize: "14px", marginTop: "-10px", paddingBottom: "10px", fontWeight: 500 }}
                      payload={[{ value: `Nivel Alcohol (${measurementUnit === "blood" ? "g/l" : "mg/l"})`, type: 'line', id: 'bac', color: 'hsl(var(--primary))' }]}
                    />
                    <ReferenceLine
                      y={legalLimitValue} yAxisId="left"
                      label={{ value: `Límite (${legalLimitValue.toFixed(measurementUnit === "breath" ? 2 : 1)})`, position: "right", fill: "hsl(var(--destructive))", fontSize: isMobile ? 10 : 12, fontWeight: "bold", dy: -5 }}
                      stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="6 3"
                      ifOverflow="visible"
                    />
                    <Line
                      yAxisId="left" type="monotone" dataKey="bac"
                      stroke="hsl(var(--primary))" strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--card))" }}
                      animationDuration={300}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <Card className="shadow-md border-border text-center overflow-hidden">
                  <CardHeader className="p-3 md:p-4 bg-muted/30 dark:bg-muted/15"><CardTitle className="text-base md:text-lg font-medium flex items-center justify-center gap-1.5"><Sparkles className="h-5 w-5 text-primary/80"/> Pico Máximo</CardTitle></CardHeader>
                  <CardContent className="p-4 md:p-5">
                    <p className="text-3xl md:text-4xl font-bold text-primary mb-1.5">
                      {peakBAC.value.toFixed(measurementUnit === "blood" ? 3 : 2)}
                      <span className="text-sm font-medium ml-1 opacity-80">{measurementUnit === "blood" ? "g/l" : "mg/l"}</span>
                    </p>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Clock className="h-3.5 w-3.5" /><span>{peakBAC.value > 0 ? `a los ${peakBAC.timeFormatted}` : "-"}</span></div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-border text-center overflow-hidden">
                  <CardHeader className="p-3 md:p-4 bg-muted/30 dark:bg-muted/15"><CardTitle className="text-base md:text-lg font-medium flex items-center justify-center gap-1.5"><Gauge className="h-5 w-5 text-primary/80"/> Tiempo Sobre Límite</CardTitle></CardHeader>
                  <CardContent className="p-4 md:p-5">
                    <p className={`text-3xl md:text-4xl font-bold mb-1.5 ${timeAboveLimit.minutes > 0 ? "text-destructive" : "text-primary"}`}>
                      {timeAboveLimit.formatted}
                    </p>
                    <div className={`text-xs flex items-center justify-center gap-1 ${timeAboveLimit.minutes > 0 ? "text-destructive/90" : "text-muted-foreground"}`}>
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Límite: {legalLimitValue.toFixed(measurementUnit === "breath" ? 2 : 1)} {measurementUnit === "blood" ? "g/l" : "mg/l"}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-border text-center overflow-hidden">
                  <CardHeader className="p-3 md:p-4 bg-muted/30 dark:bg-muted/15"><CardTitle className="text-base md:text-lg font-medium flex items-center justify-center gap-1.5"><TimerOff className="h-5 w-5 text-primary/80"/> Tiempo Hasta ~0.00</CardTitle></CardHeader>
                  <CardContent className="p-4 md:p-5">
                    <p className="text-3xl md:text-4xl font-bold text-primary mb-1.5">{timeToSober.formatted}</p>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{timeToSober.isEstimate ? "Estimación mínima" : (timeToSober.minutes > 0 ? "Tiempo total aprox." : "-")}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-5 md:p-6 rounded-lg text-amber-900 dark:text-amber-100 text-sm md:text-base flex items-start gap-4 shadow-sm">
                <AlertTriangle className="h-6 w-6 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <h4 className="font-semibold mb-2 text-base md:text-lg text-amber-950 dark:text-amber-50">Importante:</h4>
                  <ul className="list-disc list-outside pl-5 space-y-1.5 leading-relaxed">
                    <li>Utiliza la fórmula de Widmark y simula la eliminación promedio (<strong className="font-medium">{ELIMINATION_RATE_PER_HOUR.toFixed(2)} g/L/h</strong>).</li>
                    <li>El metabolismo <strong className="font-medium uppercase">real</strong> varía <strong className="font-medium">enormemente</strong> (genética, salud, comida, medicamentos, etc.) y es <strong className="font-medium">impredecible</strong>.</li>
                    <li>Estos resultados son <strong className="font-medium">SÓLO UNA ESTIMACIÓN TEÓRICA</strong>.</li>
                    <li><strong className="font-medium text-red-600 dark:text-red-400 uppercase">NO usar para decidir si conducir.</strong> La única tasa segura para conducir es <strong className="font-medium">0.0</strong>.</li>
                    <li>Límites España: Sangre {LEGAL_LIMITS.blood.standard}/{LEGAL_LIMITS.blood.novelPro} g/l | Aire {LEGAL_LIMITS.breath.standard}/{LEGAL_LIMITS.breath.novelPro} mg/l.</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}