export async function loadSwissEphemeris() {
  try {
    console.log('[SwissEph Loader] Starting module import...')
    
    const browserModule = await import('@swisseph/browser').catch((err) => {
      console.error('[SwissEph Loader] Failed to import @swisseph/browser:', err)
      throw err
    })
    
    const coreModule = await import('@swisseph/core').catch((err) => {
      console.error('[SwissEph Loader] Failed to import @swisseph/core:', err)
      throw err
    })
    
    console.log('[SwissEph Loader] Raw modules imported')
    console.log('[SwissEph Loader] Browser module keys:', Object.keys(browserModule))
    console.log('[SwissEph Loader] Core module keys:', Object.keys(coreModule))
    
    let SwissEphemeris = (browserModule as any).SwissEphemeris
    let Planet = (coreModule as any).Planet
    let HouseSystem = (coreModule as any).HouseSystem
    
    if (!SwissEphemeris && (browserModule as any).default) {
      console.log('[SwissEph Loader] Trying default export for SwissEphemeris')
      SwissEphemeris = (browserModule as any).default.SwissEphemeris || (browserModule as any).default
    }
    
    if (!Planet && (coreModule as any).default) {
      console.log('[SwissEph Loader] Trying default export for Planet')
      Planet = (coreModule as any).default.Planet || (coreModule as any).default
    }
    
    if (!HouseSystem && (coreModule as any).default) {
      console.log('[SwissEph Loader] Trying default export for HouseSystem')
      HouseSystem = (coreModule as any).default.HouseSystem || (coreModule as any).default
    }
    
    if (!SwissEphemeris) {
      throw new Error('SwissEphemeris class not found in module exports')
    }
    
    if (!Planet) {
      throw new Error('Planet enum not found in module exports')
    }
    
    if (!HouseSystem) {
      throw new Error('HouseSystem enum not found in module exports')
    }
    
    console.log('[SwissEph Loader] ✓ All modules loaded successfully')
    
    return {
      SwissEphemeris,
      Planet,
      HouseSystem
    }
  } catch (error) {
    console.error('[SwissEph Loader] Fatal error loading Swiss Ephemeris:', error)
    throw new Error(`Failed to load Swiss Ephemeris library. ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
