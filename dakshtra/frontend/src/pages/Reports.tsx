import { forecastReportApi, skillGapReportApi, workforceSummaryReportApi } from "../api/reportApi";

export default function Reports() {
  const download = async (type: "pdf" | "csv") => {
    const res = type === "pdf" ? await workforceSummaryReportApi() : await forecastReportApi();
    const blob = new Blob([res.data], { type: type === "pdf" ? "application/pdf" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = type === "pdf" ? "workforce-summary.pdf" : "forecast.csv";
    a.click();
  };

  return (
    <div className="card space-y-3">
      <h2 className="text-xl font-semibold">Reports</h2>
      <div className="flex gap-2">
        <button className="btn bg-primary text-white" onClick={() => download("pdf")}>Download PDF</button>
        <button className="btn bg-secondary text-white" onClick={() => download("csv")}>Download CSV</button>
      </div>
      <button className="btn border" onClick={() => skillGapReportApi()}>Preview Skill Gap JSON</button>
    </div>
  );
}
