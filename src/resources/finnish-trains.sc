import java.io._
import java.time.chrono.ChronoLocalDateTime
import java.time.{Instant, LocalDateTime}
import java.time.format.DateTimeFormatter

val dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
val timeDtf = DateTimeFormatter.ofPattern("HH:mm")
implicit val localDateTimeOrdering: Ordering[LocalDateTime] =
  Ordering.by((ld: LocalDateTime) => (ld : ChronoLocalDateTime[_]))

case class Train(id: String, timeText: String, kmh: String, lon: String, lat: String) {
  def time = LocalDateTime.from(dtf.parse(timeText))
  def asCsvLine: String = List(id, timeText, kmh, lon, lat).mkString(",") + "\n"
}

val lines = scala.io.Source.fromFile(
  new File("/Users/pyppe/dev/own_projects/pyppe.fi/src/resources/finnish-trains.source.csv")
).getLines.toList.distinct

val trains = lines.drop(1).map(_.split(',')).map {
  case Array(id, timeText, kmh, lon, lat) =>
    Train(id, timeText, kmh, lon, lat)
}

val trainsByMinute = trains.groupBy(t => t.id -> timeDtf.format(t.time)).map {
  case (_, trains) => trains.sortBy(_.time).last
}.toList

//trains.foldLeft(List.empty[Train], Map[String, LocalDateTime])

val newFile = new File("/Users/pyppe/dev/own_projects/pyppe.fi/src/resources/finnish-trains.csv")
newFile.delete
val fw = new FileWriter(newFile)
fw.write(lines.head + "\n")
trainsByMinute.sortBy(_.time).foreach { train =>
  fw.write(train.asCsvLine)
}
fw.close()

