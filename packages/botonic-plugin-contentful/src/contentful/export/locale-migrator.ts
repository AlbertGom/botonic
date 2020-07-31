import { SpaceExport, I18nFieldValues } from './space-export'
import assert from 'assert'

/**
 * Useful to clone the contents flow from a space when the target locales are different.
 */
export class LocaleMigrator {
  /**
   * @param fromLoc The locale whose flow we want to maintain
   * @param toLoc The locale in which `fromLoc`'s flow will be converted
   */
  constructor(readonly fromLoc: string, readonly toLoc: string) {}

  }

  static getDefaultLocale(spaceExport: SpaceExport): string {
    if (spaceExport.payload.locales) {
      for
    }
  }
  migrate(spaceExport: SpaceExport): void {
    this.migrateEntries(spaceExport)
    this.migrateLocales(spaceExport)
  }

  private migrateEntries(spaceExport: SpaceExport): void {
    for (const entry of spaceExport.payload.entries) {
      for (const fieldName of Object.getOwnPropertyNames(entry.fields)) {
        try {
          const vals = entry.fields[fieldName] as I18nFieldValues
          this.migrateField(vals)
        } catch (e) {
          const cause = e as Error
          throw Error(
            `converting entry ${
              entry.sys.id
            } field '${fieldName}': ${cause.toString()}`
          )
        }
      }
    }
  }

  private migrateField(value: I18nFieldValues): void {
    /**
     * Example: from es default to en default
     * [es: "payload"] => [en: "payload"]
     */
    if (value[this.fromLoc] == undefined) {
      // happens only for fields which are specific for a locale (eg. country stores)
      return
    }
    if (!(this.toLoc in value)) {
      value[this.toLoc] = value[this.fromLoc]
    }
    delete value[this.fromLoc]
  }

  private migrateLocales(spaceExport: SpaceExport) {
    let locales = spaceExport.payload.locales
    if (locales) {
      const fromLoc = locales.find(loc => loc.code == this.fromLoc)
      assert(fromLoc)
      const toLoc = locales.find(loc => loc.code == this.toLoc)
      if (toLoc) {
        locales = locales.filter(loc => loc.code != this.fromLoc)
        if (fromLoc.fallbackCode == toLoc.fallbackCode) {
          // @ts-ignore a bug fallbackCode type?
          toLoc.fallbackCode = null
          console.log('Removing fallback')
        }
        if (fromLoc.default) {
          console.log(`Setting '${toLoc.code}' as default locale`)
          toLoc.default = true
        }
      } else {
        fromLoc.code = this.toLoc
        fromLoc.name = this.toLoc
      }
      spaceExport.payload.locales = locales
    }
  }
}

export class LocaleRemover {
  /**
   * @param removeLocs The locales to completely remove
   */
  constructor(readonly removeLocs: string[]) {}

  remove(spaceExport: SpaceExport): void {
    this.removeEntries(spaceExport)
    this.removeLocales(spaceExport)
  }

  private removeEntries(spaceExport: SpaceExport): void {
    for (const entry of spaceExport.payload.entries) {
      for (const fieldName of Object.getOwnPropertyNames(entry.fields)) {
        const vals = entry.fields[fieldName] as I18nFieldValues
        for (const loc of this.removeLocs) {
          delete vals[loc]
        }
      }
    }
  }

  private findLocale(spaceExport: SpaceExport, locale: string): LocaleProps|undefined {
    if (!spaceExport.payload.locales) {
      return undefined
    }
    return spaceExport.payload.locales.find(loc => loc.code == locale)
  }
  private removeLocales(spaceExport: SpaceExport) {
    assert(spaceExport.payload.locales)
    for (const removeLoc of this.removeLocs) {
      if (!this.findLocale(spaceExport, removeLoc)) {
        console.error(`Expecting to remove locale ${removeLoc} but not found`)
      }
    }
    spaceExport.payload.locales = spaceExport.payload.locales.filter(
      loc => !this.removeLocs.includes(loc.code)
    )
  }
}
