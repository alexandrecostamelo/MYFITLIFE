import UIKit
import Intents
import CoreSpotlight
import UniformTypeIdentifiers

class ShortcutsManager {

    static let shared = ShortcutsManager()

    struct ShortcutDefinition {
        let type: String
        let title: String
        let phrase: String
        let description: String
        let path: String
    }

    let shortcuts: [ShortcutDefinition] = [
        ShortcutDefinition(
            type: "app.myfitlife.log-meal",
            title: "Registrar Refeição",
            phrase: "Registrar refeição no MyFitLife",
            description: "Abre a tela de nutrição pra registrar",
            path: "/app/nutrition"
        ),
        ShortcutDefinition(
            type: "app.myfitlife.start-workout",
            title: "Iniciar Treino",
            phrase: "Iniciar treino no MyFitLife",
            description: "Começa um treino ou corrida",
            path: "/app/workouts/run"
        ),
        ShortcutDefinition(
            type: "app.myfitlife.checkin",
            title: "Check-in Matinal",
            phrase: "Fazer check-in no MyFitLife",
            description: "Registra sono, energia e humor",
            path: "/app/checkin"
        ),
        ShortcutDefinition(
            type: "app.myfitlife.coach",
            title: "Falar com Coach",
            phrase: "Falar com coach no MyFitLife",
            description: "Abre o chat com seu coach IA",
            path: "/app/coach"
        ),
        ShortcutDefinition(
            type: "app.myfitlife.readiness",
            title: "Ver Readiness",
            phrase: "Ver readiness no MyFitLife",
            description: "Verifica seu score de recuperação",
            path: "/app/health/readiness"
        ),
    ]

    func donateShortcut(_ type: String) {
        guard let def = shortcuts.first(where: { $0.type == type }) else { return }

        let activity = NSUserActivity(activityType: def.type)
        activity.title = def.title
        activity.suggestedInvocationPhrase = def.phrase
        activity.isEligibleForSearch = true
        activity.isEligibleForPrediction = true
        activity.persistentIdentifier = def.type

        let attributes = CSSearchableItemAttributeSet(contentType: .item)
        attributes.contentDescription = def.description
        activity.contentAttributeSet = attributes

        activity.userInfo = ["path": def.path]
        activity.becomeCurrent()
    }

    func donateAllShortcuts() {
        for shortcut in shortcuts {
            donateShortcut(shortcut.type)
        }
    }
}
