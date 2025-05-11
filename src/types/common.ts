export type NonEmptyArray<T> = [T, ...T[]]

export type AnalysisObject = { 
    followUp: boolean; 
    response: string; 
    shouldEnd: boolean; 
}

export type InterviewQuestion = {
    question: string,
    context: string
}