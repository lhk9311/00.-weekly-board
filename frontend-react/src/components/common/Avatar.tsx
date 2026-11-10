import { avatarColor, avatarInitial } from '../../utils/avatar'

interface Props {
  name: string | null
  size?: number
}

/**
 * 담당자 아바타 (원형 이니셜)
 * 담당자가 없으면 점선 원으로 "미지정"을 표시한다.
 */
export default function Avatar({ name, size = 22 }: Props) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.45) }

  if (!name) {
    return <span className="avatar avatar--empty" style={style} aria-label="담당자 미지정" />
  }

  return (
    <span className="avatar" style={{ ...style, background: avatarColor(name) }} title={name}>
      {avatarInitial(name)}
    </span>
  )
}
