class Migrator {
  constructor(app) {
    this._app = app
  }

  async createMigration(fromUser) {
    const savedArtistsData = await this._app.getUserSavedArtists()

    return new Migration(this._app, savedArtistsData)
  }
}

class Migration {
  constructor(app, savedArtistsData) {
    this._app = app
    this._savedArtistsData = savedArtistsData
  }

  migrateToCurrentUser() {
    return this._app.setSavedArtistData(this._savedArtistsData)
  }
}

export { Migrator }
