import { getFirestore, type Firestore } from 'firebase/firestore'
import { getFirebaseApp } from './config'

let db: Firestore | undefined

export function ensureFirestore(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp())
  }
  return db
}

export function getFirestoreDb(): Firestore {
  return ensureFirestore()
}

export function todosCollectionPath(userId: string): string {
  return `users/${userId}/todos`
}

export function labelsCollectionPath(userId: string): string {
  return `users/${userId}/labels`
}

export function devicesCollectionPath(userId: string): string {
  return `users/${userId}/devices`
}

export function userDocPath(userId: string): string {
  return `users/${userId}`
}
